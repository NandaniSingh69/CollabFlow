import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, MessageSquare, X } from "lucide-react"
import { useSocket } from "@/context/SocketContext"

export default function Chat({ roomCode, onClose }) {
  const socket = useSocket()
  const [messages, setMessages] = useState([])
  const [inputValue, setInputValue] = useState("")
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!socket) return

    socket.on("chat-message", (msg) => {
      setMessages(prev => [...prev, msg])
    })

    socket.on("user-joined", ({ userName }) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: `${userName} joined`,
        type: "system",
        timestamp: new Date().toISOString()
      }])
    })

    socket.on("user-left", ({ userName }) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        message: `${userName} left`,
        type: "system",
        timestamp: new Date().toISOString()
      }])
    })

    return () => {
      socket.off("chat-message")
    }
  }, [socket])

  const sendMessage = (e) => {
    e.preventDefault()
    if (!inputValue.trim() || !socket) return

    socket.emit("chat-message", { message: inputValue })
    setInputValue("")
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="flex flex-col h-full bg-white border-l">
      {/* Header with close button */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#EA580C]" />
          <h2 className="font-heading font-semibold text-text">Chat</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-200 transition-colors"
          title="Close chat"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm mt-8">
            No messages yet. Start chatting!
          </p>
        )}
        
        {messages.map((msg) => (
          <div key={msg.id}>
            {msg.type === "system" ? (
              <div className="text-center text-xs text-gray-400 py-1">
                {msg.message}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-[#8B5CF6]">
                    {msg.userName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-text break-words">
                  {msg.message}
                </p>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-3 border-t">
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="flex-1 font-body"
            maxLength={500}
          />
          <Button
            type="submit"
            size="sm"
            disabled={!inputValue.trim()}
            className="bg-[#EA580C] hover:bg-[#EA580C]/90 text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}
