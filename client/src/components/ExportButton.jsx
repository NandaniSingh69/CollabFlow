import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ExportButton({ canvasRef, roomCode }) {
  const { toast } = useToast()

  const handleExport = () => {
    if (!canvasRef.current) return

    try {
      const canvas = canvasRef.current
      const dataUrl = canvas.toDataURL("image/png")
      
      // Create download link
      const link = document.createElement("a")
      link.download = `whiteboard-${roomCode}-${Date.now()}.png`
      link.href = dataUrl
      link.click()

      toast({
        title: "Canvas exported",
        description: "Whiteboard saved as PNG image"
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "Could not export canvas"
      })
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      className="flex items-center gap-2"
    >
      <Download className="w-4 h-4" />
      Export PNG
    </Button>
  )
}
