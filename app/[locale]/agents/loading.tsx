import { PageHeaderSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function AgentsLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Agent selector */}
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
        {/* Chat area */}
        <div className="card lg:col-span-3 h-[560px] animate-pulse bg-muted/40" />
      </div>
    </div>
  );
}
