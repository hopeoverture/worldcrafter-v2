"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to error reporting service
    console.error("Error boundary caught:", error)
  }, [error])

  return (
    <div className="container mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center py-8">
      <div className="text-center">
        <h2 className="mb-4 text-2xl font-bold">Something went wrong!</h2>
        <p className="mb-6 text-muted-foreground">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "An unexpected error occurred. Please try again."}
        </p>

        <div className="flex items-center justify-center gap-4">
          <Button onClick={reset}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Go home
          </Button>
        </div>

        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="mt-4 text-xs text-muted-foreground">
            Error digest: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
