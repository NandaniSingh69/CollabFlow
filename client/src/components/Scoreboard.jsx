import { Trophy } from "lucide-react"

export default function Scoreboard({ scores, users, currentDrawerId }) {
  const sortedUsers = users
    .map(u => ({
      ...u,
      score: scores[u.id] || 0,
      isDrawer: u.id === currentDrawerId
    }))
    .sort((a, b) => b.score - a.score)

  return (
    <div className="p-4 border-b bg-white">
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-5 h-5 text-yellow-500" />
        <h3 className="font-heading font-semibold text-text">Scoreboard</h3>
      </div>
      <div className="space-y-2">
        {sortedUsers.map((user, index) => (
          <div
            key={user.id}
            className={`flex items-center justify-between p-2 rounded-lg ${
              user.isDrawer ? "bg-[#EA580C]/10 border border-[#EA580C]/20" : "bg-gray-50"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-400 w-4">
                {index + 1}
              </span>
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.color }}
              >
                {user.userName.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-text">
                {user.userName}
                {user.isDrawer && (
                  <span className="ml-1 text-xs text-[#EA580C]">✏️ Drawing</span>
                )}
              </span>
            </div>
            <span className="text-sm font-bold text-[#8B5CF6]">
              {user.score} pts
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
