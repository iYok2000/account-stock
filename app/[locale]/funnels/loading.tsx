import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function FunnelsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-full shrink-0" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-7 w-20" />
            </div>
          </div>
        ))}
      </div>
      <div className="card h-52 animate-pulse bg-muted/40" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="card h-24 animate-pulse bg-muted/40" />
      ))}
    </div>
  );
}
