import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import roomRoutes from "./routes/rooms.js"



dotenv.config()

const app = express()
app.use(express.json())
app.use(cors({ origin: "http://localhost:5173", credentials: true }))
app.use("/api/rooms", roomRoutes)

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/collabflow"
const PORT = process.env.PORT || 4000

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo error:", err.message))

app.get("/", (req, res) => {
  res.json({ ok: true, message: "CollabFlow API running" })
})

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`)
})
