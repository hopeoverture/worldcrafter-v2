import { Card, CardContent, CardHeader } from "@/components/ui/card";

/**
 * Route-Specific Loading State for /example-form
 *
 * This displays a skeleton loader that matches the form layout,
 * providing a better user experience during page transitions.
 *
 * Skeleton loaders prevent layout shift and give users visual feedback
 * that content is loading.
 */
export default function ExampleFormLoading() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Title Skeleton */}
        <div className="h-8 w-48 animate-pulse rounded-md bg-muted"></div>

        {/* Form Card Skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 animate-pulse rounded bg-muted"></div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name Field Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
              <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
            </div>

            {/* Email Field Skeleton */}
            <div className="space-y-2">
              <div className="h-4 w-16 animate-pulse rounded bg-muted"></div>
              <div className="h-10 w-full animate-pulse rounded-md bg-muted"></div>
            </div>

            {/* Button Skeleton */}
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted"></div>
          </CardContent>
        </Card>

        {/* Additional content placeholder */}
        <div className="h-20 w-full animate-pulse rounded-md bg-muted"></div>
      </div>
    </main>
  );
}
