import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

/** Page header (title + subtitle) */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-80" />
    </div>
  );
}

/** 4-column stat cards */
export function StatCardsSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <div className={`grid gap-4 grid-cols-2 md:grid-cols-${cols}`}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="card flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Table with N rows */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      {/* Header row */}
      <div className="flex gap-4 p-3 border-b border-border bg-muted/50">
        {[40, 20, 15, 15, 10].map((w, i) => (
          <Skeleton key={i} className={`h-4 w-[${w}%]`} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-3 py-3.5 border-b border-border/50 last:border-0">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-10" />
        </div>
      ))}
    </div>
  );
}

/** Card grid */
export function CardGridSkeleton({ count = 4, cols = 2 }: { count?: number; cols?: number }) {
  return (
    <div className={`grid gap-4 md:grid-cols-${cols}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card space-y-3">
          <div className="flex justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      ))}
    </div>
  );
}

/** Filter row (search + selects + button) */
export function FilterRowSkeleton() {
  return (
    <div className="flex flex-wrap gap-3">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-9 w-32" />
      <Skeleton className="h-9 w-28" />
      <Skeleton className="ml-auto h-9 w-32" />
    </div>
  );
}

/** Split 2-col layout */
export function SplitLayoutSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card h-[420px] animate-pulse bg-muted/40" />
      <div className="space-y-4">
        <div className="card h-52 animate-pulse bg-muted/40" />
        <div className="card h-52 animate-pulse bg-muted/40" />
      </div>
    </div>
  );
}
