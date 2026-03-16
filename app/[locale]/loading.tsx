import { Skeleton, StatCardsSkeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* KPI cards */}
      <StatCardsSkeleton cols={4} />

      {/* Two-column: chart + alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 card h-56 animate-pulse bg-muted/40" />
        <div className="card space-y-3">
          <Skeleton className="h-5 w-32" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
        <div className="border-t border-border pt-3 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    </div>
  );
}
