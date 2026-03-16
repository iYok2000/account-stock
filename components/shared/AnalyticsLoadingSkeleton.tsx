"use client";

import { cn } from "@/lib/utils";

export interface AnalyticsLoadingSkeletonProps {
  /** Number of KPI cards to show (default 4) */
  kpiCount?: number;
  /** Show chart placeholder (default true) */
  showChart?: boolean;
  className?: string;
}

/**
 * Shared loading skeleton for analytics sub-pages — KPI row + optional chart area
 */
export function AnalyticsLoadingSkeleton({
  kpiCount = 4,
  showChart = true,
  className,
}: AnalyticsLoadingSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] rounded-xl border border-border bg-card animate-pulse"
          >
            <div className="p-4 space-y-2">
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-6 w-24 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
      {showChart && (
        <div className="h-[260px] rounded-xl border border-border bg-card animate-pulse flex items-center justify-center">
          <div className="h-4 w-40 bg-muted rounded" />
        </div>
      )}
    </div>
  );
}
