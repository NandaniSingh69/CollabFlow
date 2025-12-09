# CollabFlow 🎨

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://collab-flow-swart.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Real-time collaborative whiteboard with drawing game mode. Perfect for teaching, interviews, and fun multiplayer drawing games.

## ✨ Features

### Professional Mode
- 🎨 **Real-time Collaborative Drawing** - Multiple users draw together
- 👥 **Live Cursor Tracking** - See where others are drawing
- 🔒 **Host Controls** - Lock/unlock drawing for participants
- ↩️ **Undo/Redo** - Full drawing history
- 💾 **Export Canvas** - Save as PNG
- 💬 **Built-in Chat** - Communicate while drawing

### Fun Mode (Scribble Game)
- 🎮 **Drawing & Guessing Game** - Pictionary-style gameplay
- 🎯 **Automatic Drawer Rotation** - Everyone gets a turn
- ⏱️ **60-Second Timer** - Race against the clock
- 🏆 **Scoring System** - Points based on speed
- 🔄 **Auto Round Management** - Seamless game flow

## 🚀 Live Demo

**Try it now:** [https://collab-flow-swart.vercel.app](https://collab-flow-swart.vercel.app)

## 🛠️ Tech Stack

**Frontend:**
- React 18
- Vite
- TailwindCSS
- Shadcn/ui
- Socket.io Client

**Backend:**
- Node.js
- Express
- Socket.io
- MongoDB Atlas
- Mongoose

**Deployment:**
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 📦 Installation

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)

### Clone Repository
git clone https://github.com/NandaniSingh69/CollabFlow.git
cd CollabFlow


### Setup Backend
cd server
npm install

Create .env file
echo "MONGO_URI=your_mongodb_connection_string" > .env
echo "PORT=4000" >> .env
echo "NODE_ENV=development" >> .env
echo "CLIENT_URL=http://localhost:5173" >> .env

Start server
npm run dev


### Setup Frontend
cd ../client
npm install

Start development server
npm run dev

Visit `http://localhost:5173` to see the app running locally.


## 📸 Screenshots

### Home Page
![alt text](https://github.com/NandaniSingh69/CollabFlow/blob/main/client/src/assets/images/image-1.png)

### Professional Mode
![alt text](https://github.com/NandaniSingh69/CollabFlow/blob/main/client/src/assets/images/image-2.png)
### Fun Mode (Game)
![alt text](https://github.com/NandaniSingh69/CollabFlow/blob/main/client/src/assets/images/image-3.png)


## 👤 Author

**Nandani Singh**

- GitHub: [@NandaniSingh69](https://github.com/NandaniSingh69)
- LinkedIn: [Nandani Singh](https://www.linkedin.com/in/nandani-singh-2b934128b/)
- Email: nandanisingh8855@gmail.com

Made with ❤️ for real-time collaboration

