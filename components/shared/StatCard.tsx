"use client";

import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  /** Card title */
  title: string;
  /** Main metric value */
  value: string;
  /** Percentage change (optional) */
  delta?: number;
  /** Trend direction: "up" | "down" | "neutral" */
  trend?: "up" | "down" | "neutral";
  /** Icon component from lucide-react */
  icon: LucideIcon;
  /** Custom icon color classes (default: blue palette) */
  iconClassName?: string;
  /** Custom icon background classes (default: blue palette) */
  iconBgClassName?: string;
  /** Additional className for the card */
  className?: string;
}

/**
 * StatCard displays a single KPI metric with icon, value, delta trend, and optional percentage change.
 * Mobile-first responsive design using blue primary palette.
 */
export function StatCard({
  title,
  value,
  delta,
  trend = "neutral",
  icon: Icon,
  iconClassName = "text-blue-600",
  iconBgClassName = "bg-blue-100",
  className,
}: StatCardProps) {
  const isPositive = trend === "up";
  const isNegative = trend === "down";
  const isNeutral = trend === "neutral";

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColorClass = isPositive
    ? "text-green-600"
    : isNegative
      ? "text-red-500"
      : "text-gray-400";

  return (
    <div
      className={cn(
        "relative overflow-hidden card p-4 sm:p-6",
        "bg-gradient-to-br from-blue-50/30 via-white to-white",
        "border-blue-200/50 shadow-sm",
        "hover:shadow-md transition-all duration-300",
        className
      )}
    >
      {/* Decorative gradient orb */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -mr-12 -mt-12 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-[10px] sm:text-sm font-medium text-blue-600/80 truncate leading-tight uppercase tracking-wide">
              {title}
            </p>
            <p className="text-lg sm:text-2xl font-bold truncate leading-tight text-foreground tabular-nums">
              {value}
            </p>
          </div>

          {/* Icon */}
          <div
            className={cn(
              "h-10 w-10 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              "transition-transform duration-300 hover:scale-110",
              iconBgClassName
            )}
          >
            <Icon className={cn("h-5 w-5 sm:h-6 sm:w-6", iconClassName)} />
          </div>
        </div>

        {/* Delta Trend */}
        {delta !== undefined && (
          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <TrendIcon className={cn("h-4 w-4 shrink-0", trendColorClass)} />
            <span
              className={cn(
                "font-semibold tabular-nums",
                trendColorClass
              )}
            >
              {isPositive && "+"}
              {delta.toFixed(1)}%
            </span>
            <span className="text-xs text-muted-foreground">vs เดือนก่อน</span>
          </div>
        )}

        {/* Neutral trend (no delta) */}
        {delta === undefined && isNeutral && (
          <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Minus className="h-4 w-4" />
            <span className="text-xs">ไม่มีข้อมูลเปรียบเทียบ</span>
          </div>
        )}
      </div>
    </div>
  );
}
