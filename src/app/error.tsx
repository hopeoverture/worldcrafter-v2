"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Root Error Boundary
 *
 * This error boundary catches errors anywhere in the app router.
 * It's automatically invoked by Next.js when an error occurs during rendering.
 *
 * Learn more: https://nextjs.org/docs/app/building-your-application/routing/error-handling
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-red-600 dark:text-red-400">
            Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We encountered an unexpected error. Please try again.
          </p>
        </div>

        {/* Show error details in development */}
        {process.env.NODE_ENV === "development" && (
          <div className="rounded-md bg-muted p-4 text-left">
            <p className="mb-2 font-mono text-sm font-semibold">
              Error Details (Development Only):
            </p>
            <pre className="overflow-x-auto text-xs text-red-600 dark:text-red-400">
              {error.message}
            </pre>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} variant="default">
            Try again
          </Button>
          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
          >
            Go to homepage
          </Button>
        </div>

        {/* Production: Show error digest for support */}
        {process.env.NODE_ENV === "production" && error.digest && (
          <p className="text-xs text-muted-foreground">
            Error reference: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
