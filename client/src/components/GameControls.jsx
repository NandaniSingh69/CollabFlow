import { Button } from "@/components/ui/button"
import { Play, Square, RotateCcw } from "lucide-react"

export default function GameControls({ gameState, onStart, onEnd, isHost }) {
  if (!gameState?.started) {
    return (
      <div className="p-4 bg-white border-b">
        <Button
          onClick={onStart}
          disabled={!isHost}
          className="w-full bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white flex items-center justify-center gap-2"
        >
          <Play className="w-4 h-4" />
          {gameState?.round > 0 ? "Next Round" : "Start Game"}
        </Button>
        {!isHost && (
          <p className="text-xs text-gray-500 text-center mt-2">
            Waiting for host to start...
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 bg-[#8B5CF6] text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Round {gameState.round}</span>
        <span className="text-2xl font-bold">{gameState.timeLeft}s</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
        <div
          className="bg-white h-full transition-all duration-1000"
          style={{ width: `${(gameState.timeLeft / 60) * 100}%` }}
        />
      </div>
      {isHost && (
        <Button
          onClick={onEnd}
          size="sm"
          variant="ghost"
          className="w-full mt-2 text-white hover:bg-white/10"
        >
          <Square className="w-3 h-3 mr-1" />
          End Game
        </Button>
      )}
    </div>
  )
}
