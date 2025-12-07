import { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Trash2 } from "lucide-react"
import { useSocket } from "@/context/SocketContext"
import Cursor from "./Cursor"

const Whiteboard = forwardRef(({ roomCode, userName, canDraw, roomType }, ref) => {
  const socket = useSocket()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState(null)
  
  const [color, setColor] = useState("#292524")
  const [lineWidth, setLineWidth] = useState(3)
  
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Remote cursors state
  const [remoteCursors, setRemoteCursors] = useState({})
  
  const lastPoint = useRef(null)
  const animationRef = useRef(null)
  const throttleRef = useRef(null)

  const colors = ["#292524", "#EA580C", "#8B5CF6", "#16A34A", "#DC2626", "#2563EB"]
  const sizes = [2, 4, 6, 10]
useImperativeHandle(ref, () => ({
    getCanvas: () => canvasRef.current
  }))
  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      const tempCanvas = document.createElement("canvas")
      const tempCtx = tempCanvas.getContext("2d")
      tempCanvas.width = canvas.width
      tempCanvas.height = canvas.height
      tempCtx.drawImage(canvas, 0, 0)

      canvas.width = rect.width
      canvas.height = rect.height
      
      const ctx = canvas.getContext("2d")
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      ctx.drawImage(tempCanvas, 0, 0)
      setContext(ctx)
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Socket listeners
  useEffect(() => {
    if (!socket || !context) return

    socket.emit("join-room", { roomCode, userName })

    // Receive drawing from others
    socket.on("draw", (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth)
    })

    // Receive canvas state
    socket.on("canvas-state", (dataUrl) => {
      if (dataUrl) {
        const img = new Image()
        img.onload = () => {
          context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          context.drawImage(img, 0, 0)
        }
        img.src = dataUrl
      }
    })

    // Clear canvas
    socket.on("clear-canvas", () => {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setHistory([])
      setHistoryIndex(-1)
    })

    // Cursor events
    socket.on("cursor-move", ({ id, userName, color, x, y }) => {
      setRemoteCursors(prev => ({
        ...prev,
        [id]: { userName, color, x, y }
      }))
    })

    socket.on("cursor-leave", ({ id }) => {
      setRemoteCursors(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    })

    socket.on("user-left", ({ id }) => {
      setRemoteCursors(prev => {
        const updated = { ...prev }
        delete updated[id]
        return updated
      })
    })

    return () => {
      socket.off("draw")
      socket.off("canvas-state")
      socket.off("clear-canvas")
      socket.off("cursor-move")
      socket.off("cursor-leave")
      socket.off("user-left")
    }
  }, [socket, context, roomCode, userName])

  useEffect(() => {
    if (context) {
      context.strokeStyle = color
      context.lineWidth = lineWidth
    }
  }, [color, lineWidth, context])

  const drawLine = (x0, y0, x1, y1, strokeColor, strokeWidth) => {
    if (!context) return
    context.beginPath()
    context.strokeStyle = strokeColor
    context.lineWidth = strokeWidth
    context.moveTo(x0, y0)
    context.lineTo(x1, y1)
    context.stroke()
    context.closePath()
  }

  const getCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      }
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
  }

  // Throttled cursor emit (every 50ms max)
  const emitCursor = useCallback((x, y) => {
    if (throttleRef.current) return
    
    throttleRef.current = setTimeout(() => {
      throttleRef.current = null
    }, 50)

    if (socket) {
      socket.emit("cursor-move", { x, y })
    }
  }, [socket])

  const handleMouseMove = (e) => {
    const { x, y } = getCoordinates(e)
    emitCursor(x, y)
    
    if (isDrawing) {
      draw(e)
    }
  }

  const handleMouseLeave = () => {
    if (socket) {
      socket.emit("cursor-leave")
    }
    stopDrawing()
  }

 const startDrawing = (e) => {
  if (!canDraw) return  // ← ADD THIS LINE
  e.preventDefault()
  const { x, y } = getCoordinates(e)
  setIsDrawing(true)
  lastPoint.current = { x, y }
}


  const draw = useCallback((e) => {
    if (!canDraw || !isDrawing || !context || !lastPoint.current) return  
    e.preventDefault()
    
    const { x, y } = getCoordinates(e)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(() => {
      drawLine(lastPoint.current.x, lastPoint.current.y, x, y, color, lineWidth)
      
      if (socket) {
        socket.emit("draw", {
          x0: lastPoint.current.x,
          y0: lastPoint.current.y,
          x1: x,
          y1: y,
          color,
          lineWidth
        })
      }
      
      lastPoint.current = { x, y }
    })
 }, [canDraw, isDrawing, context, color, lineWidth, socket])  


  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(dataUrl)
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    if (socket) {
      socket.emit("canvas-state-update", dataUrl)
    }
    
    lastPoint.current = null
  }

  const undo = () => {
  if (historyIndex <= 0) {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistoryIndex(-1)
    if (socket) socket.emit("undo", null)  // means empty board
    return
  }

  const newIndex = historyIndex - 1
  const img = new Image()
  img.onload = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    context.drawImage(img, 0, 0)
    if (socket) socket.emit("undo", history[newIndex])
  }
  img.src = history[newIndex]
  setHistoryIndex(newIndex)
}

const redo = () => {
  if (historyIndex >= history.length - 1) return

  const newIndex = historyIndex + 1
  const img = new Image()
  img.onload = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    context.drawImage(img, 0, 0)
    if (socket) socket.emit("undo", history[newIndex])
  }
  img.src = history[newIndex]
  setHistoryIndex(newIndex)
}


  const clearCanvas = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory([])
    setHistoryIndex(-1)
    
    if (socket) socket.emit("clear-canvas")
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
  <div className="flex items-center justify-between p-3 border-b bg-white">
  <div className="flex items-center gap-4">
    {/* Your existing colors, sizes, and actions stay here */}
    <div className="flex items-center gap-1">
      {colors.map((c) => (
        <button
          key={c}
          onClick={() => setColor(c)}
          className={`w-7 h-7 rounded-full border-2 transition-transform ${
            color === c ? "border-gray-800 scale-110" : "border-transparent"
          }`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>

    <div className="w-px h-6 bg-gray-300" />

    <div className="flex items-center gap-1">
      {sizes.map((s) => (
        <button
          key={s}
          onClick={() => setLineWidth(s)}
          className={`w-8 h-8 rounded flex items-center justify-center transition-colors ${
            lineWidth === s ? "bg-gray-200" : "hover:bg-gray-100"
          }`}
        >
          <div className="rounded-full bg-gray-800" style={{ width: s + 4, height: s + 4 }} />
        </button>
      ))}
    </div>

    <div className="w-px h-6 bg-gray-300" />

    <div className="flex items-center gap-1">
      <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex < 0} title="Undo">
        <Undo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo">
        <Redo2 className="w-4 h-4" />
      </Button>
      <Button variant="ghost" size="sm" onClick={clearCanvas} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Clear">
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  </div>

  {/* ADD THIS - Right side mode badge */}
  {roomType && (
    <div className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full">
      {roomType === "professional" ? "📋 Professional Mode" : "🎮 Fun Mode"}
    </div>
  )}
</div>


      {/* Canvas container with cursors */}
      <div ref={containerRef} className="flex-1 bg-white cursor-crosshair relative overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={handleMouseLeave}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none"
        />
        
        {/* Remote cursors overlay */}
        {Object.entries(remoteCursors).map(([id, cursor]) => (
          <Cursor
            key={id}
            x={cursor.x}
            y={cursor.y}
            name={cursor.userName}
            color={cursor.color}
          />
        ))}
      </div>
    </div>
  )
})

Whiteboard.displayName = "Whiteboard"
export default Whiteboard