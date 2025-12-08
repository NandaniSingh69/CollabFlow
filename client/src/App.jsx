import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Copy, Share2, Users, Play, Loader2, Github, Linkedin, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createRoom as createRoomAPI, joinRoom as joinRoomAPI } from "@/lib/api"

const genRoomCode = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase()

export default function App() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [roomType, setRoomType] = useState("professional")
  const [loading, setLoading] = useState(false)

  const createRoom = async () => {
    if (!name.trim()) {
      return toast({ variant: "destructive", title: "Missing name", description: "Enter your display name." })
    }

    const code = genRoomCode()
    setLoading(true)

    try {
      await createRoomAPI({ code, type: roomType, name: name.trim() })
      await navigator.clipboard.writeText(code)
      toast({ title: "Room created!", description: `Code ${code} copied.` })
      navigate(`/room/${code}?name=${encodeURIComponent(name)}&type=${roomType}&host=true`)
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message })
    } finally {
      setLoading(false)
    }
  }

  const joinRoom = async () => {
  if (!name.trim() || !roomCode.trim()) {
    return toast({ variant: "destructive", title: "Missing info", description: "Enter name and room code." })
  }

  setLoading(true)

  try {
    const room = await joinRoomAPI({ code: roomCode.trim(), name: name.trim() })
    await navigator.clipboard.writeText(roomCode)
    toast({ title: "Joined!", description: `Room ${roomCode} joined.` })
    
    // ✅ FIX: Handle both 'type' and 'roomType' from API response
    const roomTypeValue = room.type || room.roomType || 'professional'
    navigate(`/room/${roomCode}?name=${encodeURIComponent(name)}&type=${roomTypeValue}&host=false`)
  } catch (err) {
    toast({ variant: "destructive", title: "Error", description: err.message })
  } finally {
    setLoading(false)
  }
}


  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-[#FFF7ED] to-[#F3E8FF] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Card className="w-full max-w-md shadow-xl border-2">
          <CardHeader className="text-center space-y-2">
            <CardTitle
              className="text-3xl md:text-4xl font-bold font-heading"
              style={{
                background: "linear-gradient(to right, #EA580C, #8B5CF6, #EA580C)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              CollabFlow
            </CardTitle>
            <CardDescription className="font-body text-text/80">
              Real-time whiteboard for teaching, interviews, and Scribble games.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              placeholder="Display name"
              className="font-body"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              maxLength={20}
            />

            <div className="space-y-2">
              <span className="text-sm font-semibold text-text font-body">Room type</span>
              <Select value={roomType} onValueChange={setRoomType} disabled={loading}>
                <SelectTrigger className="font-body">
                  <SelectValue placeholder="Choose mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">
                    <Users className="w-4 h-4 mr-2 inline" />
                    Professional (Teaching / Interview)
                  </SelectItem>
                  <SelectItem value="fun">
                    <Play className="w-4 h-4 mr-2 inline" />
                    Fun (Scribble game)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={createRoom}
                disabled={loading}
                className="bg-[#EA580C] hover:bg-[#EA580C]/90 text-white font-semibold h-11 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Create Room
              </Button>
              <Button
                variant="outline"
                onClick={joinRoom}
                disabled={loading}
                className="border-[#EA580C] text-[#EA580C] hover:bg-[#EA580C]/5 h-11 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                Join Room
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground font-body">Or join existing</span>
              </div>
            </div>

            <Input
              placeholder="Room code (e.g. ABCD)"
              className="font-body tracking-widest text-center font-mono text-lg"
              maxLength={4}
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 4))}
              disabled={loading}
            />
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-white/80 backdrop-blur-sm py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Copyright */}
          <div className="text-center md:text-left">
            <p className="text-sm text-text/70 font-body">
              © {new Date().getFullYear()} <span className="font-semibold text-[#EA580C]">CollabFlow</span>. All rights reserved.
            </p>
            <p className="text-xs text-text/50 font-body mt-1">
               Made with ❤️ for real-time collaboration
            </p>
          </div>

          {/* Social Links (optional - customize with your links) */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/NandaniSingh69"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text/60 hover:text-[#EA580C] transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href="https://www.linkedin.com/in/nandani-singh-2b934128b/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text/60 hover:text-[#8B5CF6] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
            <a
              href="mailto:nandanisingh8855@gmail.com"
              className="text-text/60 hover:text-[#EA580C] transition-colors"
              aria-label="Email"
            >
              <Mail className="w-5 h-5" />
            </a>
          </div>

          {/* Additional Links */}
          <div className="flex items-center gap-4 text-xs font-body">
            <a href="#" className="text-text/60 hover:text-[#EA580C] transition-colors">
              Privacy
            </a>
            <span className="text-text/30">•</span>
            <a href="#" className="text-text/60 hover:text-[#EA580C] transition-colors">
              Terms
            </a>
            <span className="text-text/30">•</span>
            <a href="#" className="text-text/60 hover:text-[#EA580C] transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
