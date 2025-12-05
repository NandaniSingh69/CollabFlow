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

// Store canvas state per room (in-memory for now)
const roomCanvasState = new Map()

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  // Join room
  socket.on("join-room", ({ roomCode, userName }) => {
    socket.join(roomCode)
    socket.roomCode = roomCode
    socket.userName = userName
    console.log(`${userName} joined room ${roomCode}`)

    // Send current canvas state to new joiner
    const canvasState = roomCanvasState.get(roomCode)
    if (canvasState) {
      socket.emit("canvas-state", canvasState)
    }

    // Notify others
    socket.to(roomCode).emit("user-joined", { userName })
  })

  // Drawing event - broadcast to room
  socket.on("draw", (data) => {
    socket.to(socket.roomCode).emit("draw", data)
  })

  // Canvas state update (for late joiners)
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

  // Undo/Redo sync
  socket.on("undo", (dataUrl) => {
    if (socket.roomCode) {
      roomCanvasState.set(socket.roomCode, dataUrl)
      socket.to(socket.roomCode).emit("canvas-state", dataUrl)
    }
  })

  socket.on("disconnect", () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit("user-left", { userName: socket.userName })
    }
    console.log("User disconnected:", socket.id)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
 