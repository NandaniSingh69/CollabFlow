import express from "express"
import { Room } from "../models/Room.js"

const router = express.Router()

// POST /api/rooms/create - create room
router.post("/create", async (req, res) => {
  try {
    const { code, type, name } = req.body
    if (!code || !name) {
      return res.status(400).json({ error: "code and name required" })
    }

    const existing = await Room.findOne({ code })
    if (existing) return res.status(409).json({ error: "Room code already exists" })

    const room = await Room.create({
      code,
      type: type === "fun" ? "fun" : "professional",
      hostName: name,
      participants: [{ name }]
    })

    res.status(201).json({ code: room.code, roomType: room.type })
  } catch (err) {
    console.error("Create room error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

// POST /api/rooms/join - join existing
router.post("/join", async (req, res) => {
  try {
    const { code, name } = req.body
    if (!code || !name) {
      return res.status(400).json({ error: "code and name required" })
    }

    const room = await Room.findOne({ code })
    if (!room) return res.status(404).json({ error: "Room not found" })

    if (!room.participants.some((p) => p.name === name)) {
      room.participants.push({ name })
      await room.save()
    }

    res.json({ code: room.code, roomType: room.type })
  } catch (err) {
    console.error("Join room error:", err)
    res.status(500).json({ error: "Server error" })
  }
})

export default router
