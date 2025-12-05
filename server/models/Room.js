import mongoose from "mongoose"

const roomSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true }, // e.g. ABCD
    type: { type: String, enum: ["professional", "fun"], default: "professional" },
    hostName: { type: String, required: true },
    participants: [
      {
        name: String,
        joinedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
)

export const Room = mongoose.model("Room", roomSchema)
