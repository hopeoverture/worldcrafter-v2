import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container max-w-3xl py-8">
      <div className="mb-8">
        <div className="h-9 w-64 bg-muted animate-pulse rounded" />
        <div className="mt-2 h-5 w-96 bg-muted animate-pulse rounded" />
      </div>

      <div className="space-y-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
            <div className="h-10 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}
