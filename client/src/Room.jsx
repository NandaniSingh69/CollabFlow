import { useEffect, useState, useRef } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Users, MessageSquare } from "lucide-react"
import Whiteboard from "@/components/Whiteboard"
import Chat from "@/components/Chat"
import ExportButton from "@/components/ExportButton"
import GameControls from "@/components/GameControls"
import WordDisplay from "@/components/WordDisplay"
import Scoreboard from "@/components/Scoreboard"
import { useSocket } from "@/context/SocketContext"
import { useToast } from "@/hooks/use-toast"

export default function Room() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const name = searchParams.get("name")
  const type = searchParams.get("type")
  const isHost = searchParams.get("host") === "true"

  const [room, setRoom] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [locked, setLocked] = useState(false)
  const [chatOpen, setChatOpen] = useState(true)
  const [gameState, setGameState] = useState(null)
  const whiteboardRef = useRef()
  const socket = useSocket()
  const { toast } = useToast()

  const isFunMode = type === "fun"
  const isDrawer = gameState?.drawer === socket?.id

  useEffect(() => {
    fetch(`/api/rooms/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, name }),
    })
      .then((r) => r.json())
      .then(setRoom)
      .catch(console.error)
  }, [code, name])

  useEffect(() => {
    if (!socket) return

    socket.on("users-in-room", (users) => {
      setOnlineUsers(users)
    })

    socket.on("user-joined", (user) => {
      toast({ title: "User joined", description: `${user.userName} joined the room` })
      setOnlineUsers(prev => [...prev.filter(u => u.id !== user.id), user])
    })

    socket.on("user-left", ({ id, userName }) => {
      toast({ title: "User left", description: `${userName} left the room` })
      setOnlineUsers(prev => prev.filter(u => u.id !== id))
    })

    socket.on("lock-changed", ({ locked }) => {
      setLocked(locked)
    })

    // Game events
    socket.on("game-state", (state) => {
      setGameState(state)
    })

    socket.on("timer-update", ({ timeLeft }) => {
      setGameState(prev => prev ? { ...prev, timeLeft } : null)
    })

    socket.on("correct-guess", ({ userName, word, points }) => {
      toast({
        title: "Correct! 🎉",
        description: `${userName} guessed "${word}" (+${points} pts)`,
        className: "bg-green-50 border-green-200"
      })
    })

    socket.on("round-end", ({ word, reason }) => {
      toast({
        title: "Round ended",
        description: `The word was "${word}"`,
        variant: "destructive"
      })
    })

    socket.on("game-ended", () => {
      setGameState(null)
      toast({ title: "Game ended", description: "Thanks for playing!" })
    })

    socket.on("game-error", ({ message }) => {
      toast({ variant: "destructive", title: "Error", description: message })
    })

    return () => {
      socket.off("users-in-room")
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("lock-changed")
      socket.off("game-state")
      socket.off("timer-update")
      socket.off("correct-guess")
      socket.off("round-end")
      socket.off("game-ended")
      socket.off("game-error")
    }
  }, [socket, toast])

  const handleStartGame = () => {
    socket?.emit("start-game")
  }

  const handleEndGame = () => {
    socket?.emit("end-game")
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <h1 className="text-xl font-heading font-bold text-text">
          Room: <span className="text-[#EA580C]">{code}</span>
          {isHost && <span className="ml-2 text-sm text-[#8B5CF6]">(Host)</span>}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text/60 font-body">
            Mode: <strong className="text-[#8B5CF6]">{type}</strong>
          </span>
          
          {type === "professional" && whiteboardRef.current && (
            <ExportButton 
              canvasRef={{ current: whiteboardRef.current?.getCanvas() }} 
              roomCode={code} 
            />
          )}

          {isHost && !isFunMode && (
            <button
              onClick={() => socket?.emit("set-lock", { locked: !locked })}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                locked
                  ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                  : "bg-green-50 text-green-600 border-green-200 hover:bg-green-100"
              }`}
            >
              {locked ? "🔒 Drawing locked" : "🔓 Drawing unlocked"}
            </button>
          )}
          
          {!chatOpen && (
            <button
              onClick={() => setChatOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[#EA580C] hover:bg-[#EA580C]/90 text-white flex items-center gap-2 text-sm font-medium transition-colors"
            >
              <MessageSquare className="w-4 h-4" />
              Open Chat
            </button>
          )}
          
          <span className="text-sm text-text/60 font-body flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {onlineUsers.length} online
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-64 border-r bg-white flex flex-col overflow-hidden">
          {isFunMode && gameState ? (
            <>
              <GameControls 
                gameState={gameState} 
                onStart={handleStartGame}
                onEnd={handleEndGame}
                isHost={isHost}
              />
              <WordDisplay 
                word={gameState.word}
                isDrawer={isDrawer}
                gameStarted={gameState.started}
              />
              <div className="flex-1 overflow-y-auto">
                <Scoreboard 
                  scores={gameState.scores || {}}
                  users={onlineUsers}
                  currentDrawerId={gameState.drawer}
                />
              </div>
            </>
          ) : (
            <>
              {isFunMode && (
                <GameControls 
                  gameState={gameState}
                  onStart={handleStartGame}
                  onEnd={handleEndGame}
                  isHost={isHost}
                />
              )}
              <div className="p-4 flex flex-col flex-1 overflow-hidden">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="w-5 h-5 text-[#EA580C]" />
                  <h2 className="font-heading font-semibold text-text">
                    Participants ({onlineUsers.length})
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {onlineUsers.map((user) => (
                    <div key={user.id} className="flex items-center gap-2 p-2 rounded-lg bg-background">
                      <div className="relative">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                      </div>
                      <span className="font-body text-sm text-text">
                        {user.userName}
                        {user.userName === name && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Whiteboard 
            ref={whiteboardRef}
            roomCode={code} 
            userName={name} 
            canDraw={isFunMode ? (gameState?.started && isDrawer) : (!locked || isHost)}
            roomType={type}
          />
        </main>

        {/* Right Sidebar - Chat */}
        {chatOpen && (
          <aside className="w-80">
            <Chat roomCode={code} onClose={() => setChatOpen(false)} />
          </aside>
        )}
      </div>
    </div>
  )
}
