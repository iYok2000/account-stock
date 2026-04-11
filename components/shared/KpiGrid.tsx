"use client";

import { cn } from "@/lib/utils";

export interface KpiGridProps {
  /** StatCard or other grid items */
  children: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Override default columns */
  cols?: string;
}

/**
 * KpiGrid provides a responsive grid layout for StatCard items.
 * Default: 1 col mobile, 2 col tablet, 4 col desktop
 */
export function KpiGrid({
  children,
  className,
  cols,
}: KpiGridProps) {
  const gridCols = cols ?? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4";

  return (
    <div
      className={cn(
        "grid gap-4",
        gridCols,
        className
      )}
    >
      {children}
    </div>
  );
}
