import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { createServer } from "http"
import { Server } from "socket.io"
import roomRoutes from "./routes/rooms.js"

dotenv.config()

const app = express()
const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
})

app.use(express.json())
app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use("/api/rooms", roomRoutes)

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collabflow"
const PORT = process.env.PORT || 4000

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err.message))

// Store canvas state and online users per room
const roomCanvasState = new Map()
const roomUsers = new Map() // roomCode -> Map(socketId -> { userName, color })

// Generate random color for user cursor
const getRandomColor = () => {
  const colors = ["#EA580C", "#8B5CF6", "#16A34A", "#2563EB", "#DC2626", "#D946EF", "#0891B2"]
  return colors[Math.floor(Math.random() * colors.length)]
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join room
  socket.on("join-room", ({ roomCode, userName }) => {
    socket.join(roomCode)
    socket.roomCode = roomCode
    socket.userName = userName
    socket.userColor = getRandomColor()

    // Add user to room's user list
    if (!roomUsers.has(roomCode)) {
      roomUsers.set(roomCode, new Map())
    }
    roomUsers.get(roomCode).set(socket.id, {
      id: socket.id,
      userName,
      color: socket.userColor
    })

    console.log(`${userName} joined room ${roomCode}`)

    // Send current canvas state to new joiner
    const canvasState = roomCanvasState.get(roomCode)
    if (canvasState) {
      socket.emit("canvas-state", canvasState)
    }

    // Send current online users to new joiner
    const users = Array.from(roomUsers.get(roomCode).values())
    socket.emit("users-in-room", users)

    // Notify others about new user
    socket.to(roomCode).emit("user-joined", {
      id: socket.id,
      userName,
      color: socket.userColor
    })
  })

  // Cursor movement - throttled on client, broadcast to room
  socket.on("cursor-move", ({ x, y }) => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit("cursor-move", {
        id: socket.id,
        userName: socket.userName,
        color: socket.userColor,
        x,
        y
      })
    }
  })

  // Cursor leaves canvas
  socket.on("cursor-leave", () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit("cursor-leave", { id: socket.id })
    }
  })

  // Drawing event
  socket.on("draw", (data) => {
    socket.to(socket.roomCode).emit("draw", data)
  })

  // Canvas state update
  socket.on("canvas-state-update", (dataUrl) => {
    if (socket.roomCode) {
      roomCanvasState.set(socket.roomCode, dataUrl)
    }
  })

  // Clear canvas
  socket.on("clear-canvas", () => {
    if (socket.roomCode) {
      roomCanvasState.delete(socket.roomCode)
      socket.to(socket.roomCode).emit("clear-canvas")
    }
  })

  // Undo
  socket.on("undo", (dataUrl) => {
    if (socket.roomCode) {
      roomCanvasState.set(socket.roomCode, dataUrl)
      socket.to(socket.roomCode).emit("canvas-state", dataUrl)
    }
  })

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.roomCode) {
      // Remove user from room
      if (roomUsers.has(socket.roomCode)) {
        roomUsers.get(socket.roomCode).delete(socket.id)
        if (roomUsers.get(socket.roomCode).size === 0) {
          roomUsers.delete(socket.roomCode)
        }
      }

      socket.to(socket.roomCode).emit("user-left", {
        id: socket.id,
        userName: socket.userName
      })
    }
    console.log("User disconnected:", socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
