import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Undo2, Redo2, Trash2 } from "lucide-react"

export default function Whiteboard() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [context, setContext] = useState(null)
  
  // Drawing state
  const [color, setColor] = useState("#292524")
  const [lineWidth, setLineWidth] = useState(3)
  
  // History for undo/redo
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  // Current stroke points (for smooth drawing)
  const currentStroke = useRef([])
  const animationRef = useRef(null)

  // Colors palette
  const colors = ["#292524", "#EA580C", "#8B5CF6", "#16A34A", "#DC2626", "#2563EB"]
  const sizes = [2, 4, 6, 10]

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Set canvas size to match container
    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width
      canvas.height = rect.height
      
      const ctx = canvas.getContext("2d")
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      ctx.strokeStyle = color
      ctx.lineWidth = lineWidth
      setContext(ctx)
      
      // Redraw current state after resize
      if (historyIndex >= 0 && history[historyIndex]) {
        const img = new Image()
        img.onload = () => ctx.drawImage(img, 0, 0)
        img.src = history[historyIndex]
      }
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)
    return () => window.removeEventListener("resize", resizeCanvas)
  }, [])

  // Update context when color/size changes
  useEffect(() => {
    if (context) {
      context.strokeStyle = color
      context.lineWidth = lineWidth
    }
  }, [color, lineWidth, context])

  // Get coordinates from mouse or touch event
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

  // Start drawing
  const startDrawing = (e) => {
    e.preventDefault()
    const { x, y } = getCoordinates(e)
    setIsDrawing(true)
    currentStroke.current = [{ x, y }]
    
    context.beginPath()
    context.moveTo(x, y)
  }

  // Draw with requestAnimationFrame for smooth rendering
  const draw = useCallback((e) => {
    if (!isDrawing || !context) return
    e.preventDefault()
    
    const { x, y } = getCoordinates(e)
    currentStroke.current.push({ x, y })

    // Cancel previous frame and request new one
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    animationRef.current = requestAnimationFrame(() => {
      context.lineTo(x, y)
      context.stroke()
    })
  }, [isDrawing, context])

  // Stop drawing and save to history
  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    context.closePath()
    
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Save current canvas state to history
    if (currentStroke.current.length > 1) {
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL()
      
      // Remove any redo states after current index
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(dataUrl)
      
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
    
    currentStroke.current = []
  }

  // Undo
  const undo = () => {
    if (historyIndex <= 0) {
      // Clear canvas if at beginning
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setHistoryIndex(-1)
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
  }

  // Redo
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
  }

  // Clear canvas
  const clearCanvas = () => {
    context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    setHistory([])
    setHistoryIndex(-1)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-4 p-3 border-b bg-white">
        {/* Colors */}
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

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Sizes */}
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

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={undo}
            disabled={historyIndex < 0}
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearCanvas}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
            title="Clear"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Canvas container */}
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
