import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 md:grid-cols-2 max-w-5xl">
        <div className="card md:col-span-2 h-40 animate-pulse bg-muted/40" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
