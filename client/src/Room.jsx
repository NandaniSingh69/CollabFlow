import { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users } from "lucide-react"
import Whiteboard from "@/components/Whiteboard"

export default function Room() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const name = searchParams.get("name")
  const type = searchParams.get("type")
  const isHost = searchParams.get("host") === "true"

  const [room, setRoom] = useState(null)

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

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white shadow-sm">
        <h1 className="text-xl font-heading font-bold text-text">
          Room: <span className="text-[#EA580C]">{code}</span>
          {isHost && <span className="ml-2 text-sm text-[#8B5CF6]">(Host)</span>}
        </h1>
        <span className="text-sm text-text/60 font-body">
          Mode: <strong className="text-[#8B5CF6]">{type}</strong>
        </span>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Participants */}
        <aside className="w-64 border-r bg-white p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[#EA580C]" />
            <h2 className="font-heading font-semibold text-text">Participants</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2">
            {room?.participants?.map((p, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-background"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: p.name === room.hostName ? "#8B5CF6" : "#EA580C" }}
                >
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-body text-sm text-text">
                  {p.name}
                  {p.name === room.hostName && (
                    <span className="ml-1 text-xs text-[#8B5CF6]">(host)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Canvas area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Whiteboard />
        </main>
      </div>
    </div>
  )
}
