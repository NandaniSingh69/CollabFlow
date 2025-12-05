import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./App.jsx"
import Room from "./Room.jsx"
import { Toaster } from "@/components/ui/toaster"
import { SocketProvider } from "@/context/SocketContext"
import "@fontsource/nunito/700.css"
import "@fontsource/open-sans/400.css"
import "./index.css"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/room/:code" element={<Room />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </SocketProvider>
  </React.StrictMode>
)
