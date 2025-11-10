import { Skeleton } from "@/components/ui/skeleton";

export default function CharacterDetailLoading() {
  return (
    <div className="container max-w-7xl py-10">
      <div className="mb-8 space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-32" />
          <span className="text-muted-foreground">/</span>
          <Skeleton className="h-5 w-24" />
          <span className="text-muted-foreground">/</span>
          <Skeleton className="h-5 w-32" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Info Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>

          {/* Content Cards */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-1">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}
