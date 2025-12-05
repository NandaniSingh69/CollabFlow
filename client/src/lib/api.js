const API_BASE = "/api"

export async function createRoom({ code, type, name }) {
  const res = await fetch(`${API_BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, type, name }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Failed to create room")
  return data
}

export async function joinRoom({ code, name }) {
  const res = await fetch(`${API_BASE}/rooms/join`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, name }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || "Room not found")
  return data
}
