"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Route-Specific Error Boundary for /example-form
 *
 * This error boundary only catches errors within the /example-form route.
 * It provides a more contextual error message specific to form submissions.
 *
 * Route-specific error boundaries allow you to:
 * - Provide context-aware error messages
 * - Keep other parts of the app functional
 * - Customize recovery actions per route
 */
export default function ExampleFormError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Form error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-red-600 dark:text-red-400">
            Form Error
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            We encountered an error while processing your form. Your data has
            not been saved.
          </p>

          {/* Development-only error details */}
          {process.env.NODE_ENV === "development" && (
            <div className="rounded-md bg-muted p-3">
              <p className="mb-1 text-xs font-semibold">
                Error (Development Only):
              </p>
              <pre className="overflow-x-auto text-xs text-red-600 dark:text-red-400">
                {error.message}
              </pre>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={() => reset()} className="w-full">
              Try submitting again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="w-full"
            >
              Return to home
            </Button>
          </div>

          {error.digest && (
            <p className="text-center text-xs text-muted-foreground">
              Reference: {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
