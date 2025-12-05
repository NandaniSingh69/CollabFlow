import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Trash2 } from "lucide-react"
import { useSocket } from "@/context/SocketContext"

export default function Whiteboard({ roomCode, userName }) {
  const socket = useSocket()
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState(null)
  
  const [color, setColor] = useState("#292524")
  const [lineWidth, setLineWidth] = useState(3)
  
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const lastPoint = useRef(null)
  const animationRef = useRef(null)

  const colors = ["#292524", "#EA580C", "#8B5CF6", "#16A34A", "#DC2626", "#2563EB"]
  const sizes = [2, 4, 6, 10]

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

    // Join room
    socket.emit("join-room", { roomCode, userName })

    // Receive drawing from others
    socket.on("draw", (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.lineWidth)
    })

    // Receive full canvas state (for late joiners)
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

    // Clear canvas from others
    socket.on("clear-canvas", () => {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setHistory([])
      setHistoryIndex(-1)
    })

    return () => {
      socket.off("draw")
      socket.off("canvas-state")
      socket.off("clear-canvas")
    }
  }, [socket, context, roomCode, userName])

  // Update context when color/size changes
  useEffect(() => {
    if (context) {
      context.strokeStyle = color
      context.lineWidth = lineWidth
    }
  }, [color, lineWidth, context])

  // Draw a line (used for both local and remote drawing)
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

  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    setIsDrawing(true)
    lastPoint.current = { x, y }
  }

  const draw = useCallback((e) => {
    if (!isDrawing || !context || !lastPoint.current) return
    e.preventDefault()
    
    const { x, y } = getCoordinates(e)

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(() => {
      // Draw locally
      drawLine(lastPoint.current.x, lastPoint.current.y, x, y, color, lineWidth)
      
      // Emit to others
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
  }, [isDrawing, context, color, lineWidth, socket])

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Save to history
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL()
    
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(dataUrl)
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Send canvas state for late joiners
    if (socket) {
      socket.emit("canvas-state-update", dataUrl)
    }
    
    lastPoint.current = null
  }

  const undo = () => {
    if (historyIndex <= 0) {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setHistoryIndex(-1)
      if (socket) socket.emit("undo", null)
      return
    }
    
    const newIndex = historyIndex - 1
    const img = new Image()
    img.onload = () => {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      context.drawImage(img, 0, 0)
    }
    img.src = history[newIndex]
    setHistoryIndex(newIndex)
    
    if (socket) socket.emit("undo", history[newIndex])
  }

  const redo = () => {
    if (historyIndex >= history.length - 1) return
    
    const newIndex = historyIndex + 1
    const img = new Image()
    img.onload = () => {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      context.drawImage(img, 0, 0)
    }
    img.src = history[newIndex]
    setHistoryIndex(newIndex)
    
    if (socket) socket.emit("undo", history[newIndex])
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
      <div className="flex items-center gap-4 p-3 border-b bg-white">
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
              <div
                className="rounded-full bg-gray-800"
                style={{ width: s + 4, height: s + 4 }}
              />
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

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 bg-white cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="touch-none"
        />
      </div>
    </div>
  )
}
