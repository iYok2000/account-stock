"use client";

import { cn } from "@/lib/utils";

export interface ChartNarrativeProps {
  text: string | null;
  className?: string;
}

/**
 * ข้อความ narrative แสดงใต้ chart (ตาม spec profitability)
 */
export function ChartNarrative({ text, className }: ChartNarrativeProps) {
  if (!text) return null;
  return (
    <p className={cn("text-xs text-muted-foreground mt-2", className)}>
      {text}
    </p>
  );
}
