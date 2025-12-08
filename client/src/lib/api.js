// Use environment variable for API URL, fallback to localhost
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000"

export async function createRoom({ code, type, name }) {
  const res = await fetch(`${API_BASE}/api/rooms/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hostName: name, roomType: type }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Failed to create room")
  return data
}

export async function joinRoom({ code, name }) {
  const res = await fetch(`${API_BASE}/api/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Room not found")
  return data
}
