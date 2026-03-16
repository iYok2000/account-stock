import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function ImportLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      {/* Step indicators */}
      <div className="flex items-center gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            {i < 3 && <Skeleton className="h-1 w-12" />}
          </div>
        ))}
      </div>
      <div className="card h-64 animate-pulse bg-muted/40" />
    </div>
  );
}
