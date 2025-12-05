import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const newSocket = io("http://localhost:4000", {
      withCredentials: true
    })

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id)
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
