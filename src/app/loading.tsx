/**
 * Root Loading State
 *
 * This component displays while the initial page is loading.
 * It's automatically shown by Next.js during navigation or data fetching.
 *
 * Learn more: https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="space-y-4 text-center">
        {/* Animated spinner */}
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
