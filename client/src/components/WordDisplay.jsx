import { Eye, EyeOff } from "lucide-react"

export default function WordDisplay({ word, isDrawer, gameStarted }) {
  if (!gameStarted) {
    return (
      <div className="p-4 bg-gray-50 border-b text-center">
        <p className="text-sm text-gray-500">Game not started</p>
      </div>
    )
  }

  if (isDrawer) {
    return (
      <div className="p-4 bg-[#EA580C] text-white border-b">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Eye className="w-4 h-4" />
          <span className="text-xs font-medium uppercase tracking-wide">Your word</span>
        </div>
        <p className="text-2xl font-bold text-center tracking-wider">
          {word}
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-green-50 border-b text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <EyeOff className="w-4 h-4 text-green-600" />
        <span className="text-xs font-medium uppercase tracking-wide text-green-600">
          Guess the word
        </span>
      </div>
      <div className="flex justify-center gap-1">
        {word ? (
          word.split("").map((char, i) => (
            <div
              key={i}
              className="w-8 h-10 bg-white border-2 border-green-200 rounded flex items-center justify-center text-xl font-bold text-gray-400"
            >
              _
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Waiting for word...</p>
        )}
      </div>
    </div>
  )
}
