"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function WorldSettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("World settings error:", error)
  }, [error])

  return (
    <div className="container max-w-4xl py-8">
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/worlds">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Worlds
          </Link>
        </Button>

        <h1 className="text-3xl font-bold tracking-tight">World Settings</h1>
      </div>

      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <CardTitle className="text-destructive">Error</CardTitle>
          </div>
          <CardDescription>
            Something went wrong while loading world settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>

          <div className="flex gap-2">
            <Button onClick={reset} variant="outline">
              Try Again
            </Button>
            <Button asChild>
              <Link href="/worlds">Return to Worlds</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
