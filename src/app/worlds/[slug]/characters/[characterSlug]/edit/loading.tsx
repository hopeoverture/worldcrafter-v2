import { Skeleton } from "@/components/ui/skeleton";

export default function EditCharacterLoading() {
  return (
    <div className="container max-w-4xl py-10">
      <div className="mb-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>

      {/* Tab navigation skeleton */}
      <div className="mb-6">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Form fields skeleton */}
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Submit button skeleton */}
      <div className="mt-8 flex gap-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
