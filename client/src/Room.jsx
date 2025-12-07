import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Users } from "lucide-react"
import Whiteboard from "@/components/Whiteboard"
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
  const socket = useSocket()
  const { toast } = useToast()

  // Fetch room data
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

  // Socket events for online users
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

    return () => {
      socket.off("users-in-room")
      socket.off("user-joined")
      socket.off("user-left")
      socket.off("lock-changed")
    }
  }, [socket, toast])

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
          <span className="text-sm text-text/60 font-body flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {onlineUsers.length} online
          </span>
          <button
      disabled={!isHost}
      onClick={() => socket?.emit("set-lock", { locked: !locked })}
      className={`px-3 py-1 rounded-full text-xs font-medium border ${
        locked
          ? "bg-red-50 text-red-600 border-red-200"
          : "bg-green-50 text-green-600 border-green-200"
      }`}
    >
      {locked ? "Drawing locked" : "Drawing unlocked"}
    </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-white p-4 flex flex-col">
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
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
                </div>
                <span className="font-body text-sm text-text">
                  {user.userName}
                  {user.userName === name && <span className="ml-1 text-xs text-gray-400">(you)</span>}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Whiteboard roomCode={code} userName={name} canDraw={!locked || isHost} />
        </main>
      </div>
    </div>
  )
}
