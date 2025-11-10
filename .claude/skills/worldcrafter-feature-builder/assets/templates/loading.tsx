export default function Loading() {
  return (
    <div className="container mx-auto max-w-2xl py-8">
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="h-10 w-64 animate-pulse rounded bg-muted" />

        {/* Form skeleton */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-20 animate-pulse rounded bg-muted" />
            <div className="h-10 w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>

          <div className="flex gap-4">
            <div className="h-10 w-32 animate-pulse rounded bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    </div>
  )
}
