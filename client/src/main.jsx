import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import App from "./App.jsx"
import Room from "./Room.jsx"
import "./index.css"
import "@fontsource/nunito/700.css"
import "@fontsource/open-sans/400.css"
import { Toaster } from "@/components/ui/toaster"

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
<BrowserRouter>
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/room/:code" element={<Room />} />
    </Routes>
  </div>
  <Toaster />
</BrowserRouter>

  </React.StrictMode>
)
