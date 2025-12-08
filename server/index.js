import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import { createServer } from "http"
import { Server } from "socket.io"
import roomRoutes from "./routes/rooms.js"
import { readFileSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const wordsData = JSON.parse(readFileSync(join(__dirname, "data", "words.json"), "utf8"))

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

// Store state
const roomCanvasState = new Map()
const roomUsers = new Map()
const roomLocks = new Map()
const gameStates = new Map() // roomCode -> { word, drawer, round, scores, timer, started }

const getRandomColor = () => {
  const colors = ["#EA580C", "#8B5CF6", "#16A34A", "#2563EB", "#DC2626", "#D946EF", "#0891B2"]
  return colors[Math.floor(Math.random() * colors.length)]
}

const getRandomWord = () => {
  const words = wordsData.easy
  return words[Math.floor(Math.random() * words.length)]
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id)

  socket.on("join-room", ({ roomCode, userName }) => {
    socket.join(roomCode)
    socket.roomCode = roomCode
    socket.userName = userName
    socket.userColor = getRandomColor()

    if (!roomUsers.has(roomCode)) {
      roomUsers.set(roomCode, new Map())
    }
    roomUsers.get(roomCode).set(socket.id, {
      id: socket.id,
      userName,
      color: socket.userColor
    })

    console.log(`${userName} joined room ${roomCode}`)

    const canvasState = roomCanvasState.get(roomCode)
    if (canvasState) {
      socket.emit("canvas-state", canvasState)
    }

    const users = Array.from(roomUsers.get(roomCode).values())
    socket.emit("users-in-room", users)

    const locked = roomLocks.get(roomCode) || false
    socket.emit("lock-changed", { locked })

    // Send game state if exists
    // Send game state if exists
const gameState = gameStates.get(roomCode)
if (gameState) {
  socket.emit("game-state", {
    word: gameState.drawer === socket.id ? gameState.word : null,
    drawer: gameState.drawer,
    round: gameState.round,
    scores: gameState.scores,
    timeLeft: gameState.timeLeft,
    started: gameState.started
    // Don't send timerInterval!
  })
}


    socket.to(roomCode).emit("user-joined", {
      id: socket.id,
      userName,
      color: socket.userColor
    })
  })

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

  socket.on("cursor-leave", () => {
    if (socket.roomCode) {
      socket.to(socket.roomCode).emit("cursor-leave", { id: socket.id })
    }
  })

  socket.on("draw", (data) => {
    socket.to(socket.roomCode).emit("draw", data)
  })

  socket.on("canvas-state-update", (dataUrl) => {
    if (socket.roomCode) {
      roomCanvasState.set(socket.roomCode, dataUrl)
    }
  })

  socket.on("clear-canvas", () => {
    if (socket.roomCode) {
      roomCanvasState.delete(socket.roomCode)
      socket.to(socket.roomCode).emit("clear-canvas")
    }
  })

  socket.on("undo", (dataUrl) => {
    if (socket.roomCode) {
      roomCanvasState.set(socket.roomCode, dataUrl)
      socket.to(socket.roomCode).emit("canvas-state", dataUrl)
    }
  })

  socket.on("set-lock", ({ locked }) => {
    if (!socket.roomCode) return
    roomLocks.set(socket.roomCode, locked)
    io.to(socket.roomCode).emit("lock-changed", { locked })
  })

socket.on("chat-message", ({ message }) => {
  if (!socket.roomCode || !message.trim()) return
  
  const gameState = gameStates.get(socket.roomCode)
  
  // Check if it's a correct guess in game mode
  if (gameState && gameState.started && socket.id !== gameState.drawer) {
    if (message.trim().toLowerCase() === gameState.word.toLowerCase()) {
      // Correct guess!
      const points = Math.max(10, Math.floor(gameState.timeLeft / 2))
      
      if (!gameState.scores[socket.id]) {
        gameState.scores[socket.id] = 0
      }
      gameState.scores[socket.id] += points
      
      io.to(socket.roomCode).emit("correct-guess", {
        userName: socket.userName,
        word: gameState.word,
        points
      })
      
      // Send clean state without timerInterval
      io.to(socket.roomCode).emit("game-state", {
        word: gameState.word, // Reveal word to all
        drawer: gameState.drawer,
        round: gameState.round,
        scores: gameState.scores,
        timeLeft: gameState.timeLeft,
        started: false  // ✅ Mark as not started
      })
      
      // End round
      clearInterval(gameState.timerInterval)
      gameState.started = false
      
      // ✅ Auto-start next round after 3 seconds
      setTimeout(() => {
        const roomCode = socket.roomCode
        if (!roomCode) return
        
        const users = roomUsers.get(roomCode)
        if (!users || users.size < 2) return
        
        const userList = Array.from(users.values())
        const currentGame = gameStates.get(roomCode)
        if (!currentGame) return
        
        const currentDrawerIndex = userList.findIndex(u => u.id === currentGame.drawer)
        const nextDrawerIndex = (currentDrawerIndex + 1) % userList.length
        const drawer = userList[nextDrawerIndex].id
        const word = getRandomWord()
        
        const newGameState = {
          word,
          drawer,
          round: currentGame.round + 1,
          scores: currentGame.scores,
          timeLeft: 60,
          started: true
        }
        
        gameStates.set(roomCode, newGameState)
        
        // Clear canvas
        io.to(roomCode).emit("clear-canvas")
        roomCanvasState.delete(roomCode)
        
        // Send new game state
        userList.forEach(u => {
          io.to(u.id).emit("game-state", {
            word: u.id === drawer ? word : null,
            drawer: newGameState.drawer,
            round: newGameState.round,
            scores: newGameState.scores,
            timeLeft: newGameState.timeLeft,
            started: newGameState.started
          })
        })
        
        // Start timer
        newGameState.timerInterval = setInterval(() => {
          newGameState.timeLeft--
          
          if (newGameState.timeLeft <= 0) {
            clearInterval(newGameState.timerInterval)
            newGameState.started = false
            
            io.to(roomCode).emit("round-end", {
              word: newGameState.word,
              reason: "time"
            })
            
            io.to(roomCode).emit("game-state", {
              word: newGameState.word,
              drawer: newGameState.drawer,
              round: newGameState.round,
              scores: newGameState.scores,
              timeLeft: newGameState.timeLeft,
              started: newGameState.started
            })
          } else {
            io.to(roomCode).emit("timer-update", { timeLeft: newGameState.timeLeft })
          }
        }, 1000)
      }, 3000)
      
      return
    }
  }
  
  const chatData = {
    id: Date.now(),
    userName: socket.userName,
    message: message.trim(),
    timestamp: new Date().toISOString(),
    type: "user"
  }
  
  io.to(socket.roomCode).emit("chat-message", chatData)
})



  // Game events
// Game events
socket.on("start-game", () => {
  if (!socket.roomCode) return
  
  const users = Array.from(roomUsers.get(socket.roomCode).values())
  if (users.length < 2) {
    socket.emit("game-error", { message: "Need at least 2 players" })
    return
  }
  
  const currentGame = gameStates.get(socket.roomCode)
  let nextDrawerIndex = 0
  
  if (currentGame) {
    const currentDrawerIndex = users.findIndex(u => u.id === currentGame.drawer)
    nextDrawerIndex = (currentDrawerIndex + 1) % users.length
  }
  
  const drawer = users[nextDrawerIndex].id
  const word = getRandomWord()
  
  const gameState = {
    word,
    drawer,
    round: (currentGame?.round || 0) + 1,
    scores: currentGame?.scores || {},
    timeLeft: 60,
    started: true
  }
  
  // Initialize scores for new players
  users.forEach(u => {
    if (!gameState.scores[u.id]) {
      gameState.scores[u.id] = 0
    }
  })
  
  gameStates.set(socket.roomCode, gameState)
  
  // Clear canvas
  io.to(socket.roomCode).emit("clear-canvas")
  roomCanvasState.delete(socket.roomCode)
  
  // Send game state (word only to drawer) - ✅ Clean state
  users.forEach(u => {
    io.to(u.id).emit("game-state", {
      word: u.id === drawer ? word : null,
      drawer: gameState.drawer,
      round: gameState.round,
      scores: gameState.scores,
      timeLeft: gameState.timeLeft,
      started: gameState.started
    })
  })
  
  // Start timer
  gameState.timerInterval = setInterval(() => {
    gameState.timeLeft--
    
    if (gameState.timeLeft <= 0) {
      clearInterval(gameState.timerInterval)
      gameState.started = false
      
      io.to(socket.roomCode).emit("round-end", {
        word: gameState.word,
        reason: "time"
      })
      
      // ✅ Clean state on round end
      io.to(socket.roomCode).emit("game-state", {
        word: gameState.word, // Reveal word
        drawer: gameState.drawer,
        round: gameState.round,
        scores: gameState.scores,
        timeLeft: gameState.timeLeft,
        started: gameState.started
      })
    } else {
      io.to(socket.roomCode).emit("timer-update", { timeLeft: gameState.timeLeft })
    }
  }, 1000)
})


  socket.on("end-game", () => {
    if (!socket.roomCode) return
    
    const gameState = gameStates.get(socket.roomCode)
    if (gameState?.timerInterval) {
      clearInterval(gameState.timerInterval)
    }
    
    gameStates.delete(socket.roomCode)
    io.to(socket.roomCode).emit("game-ended")
  })

  socket.on("disconnect", () => {
    if (socket.roomCode) {
      if (roomUsers.has(socket.roomCode)) {
        roomUsers.get(socket.roomCode).delete(socket.id)
        if (roomUsers.get(socket.roomCode).size === 0) {
          roomUsers.delete(socket.roomCode)
          roomCanvasState.delete(socket.roomCode)
          roomLocks.delete(socket.roomCode)
          
          // Clean up game
          const gameState = gameStates.get(socket.roomCode)
          if (gameState?.timerInterval) {
            clearInterval(gameState.timerInterval)
          }
          gameStates.delete(socket.roomCode)
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
