import { useSearchParams, useParams } from "react-router-dom"

export default function Room() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const name = searchParams.get("name")
  const type = searchParams.get("type")
  const host = searchParams.get("host")

  return (
    <div className="min-h-screen bg-background p-8 font-body">
      <h1 className="text-3xl font-heading font-bold mb-4 text-text">
        Room: {code}
      </h1>
      <pre className="bg-white/70 border border-primary/20 rounded-xl p-4 text-sm">
        {JSON.stringify({ name, type, host }, null, 2)}
      </pre>
      <p className="mt-4 text-text/70">
        Phase 1 done: routing + landing ready. Next: backend room API (Phase 2).
      </p>
    </div>
  )
}
