"use client";

import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type InsightSeverity = "success" | "info" | "warning" | "danger";

const SEVERITY_STYLES: Record<
  InsightSeverity,
  { icon: React.ElementType; bg: string; border: string; iconCls: string; text: string }
> = {
  success: {
    icon: CheckCircle2,
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    iconCls: "text-emerald-600",
    text: "text-emerald-800",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    iconCls: "text-blue-600",
    text: "text-blue-800",
  },
  warning: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconCls: "text-amber-600",
    text: "text-amber-800",
  },
  danger: {
    icon: XCircle,
    bg: "bg-red-50",
    border: "border-red-200",
    iconCls: "text-red-600",
    text: "text-red-800",
  },
};

export interface InsightFirstWrapperProps {
  severity: InsightSeverity;
  message: string;
  title?: string;
  className?: string;
}

/**
 * Insight banner ใช้เหนือ chart / section — severity กำหนดสีและไอคอน
 */
export function InsightFirstWrapper({
  severity,
  message,
  title,
  className,
}: InsightFirstWrapperProps) {
  const style = SEVERITY_STYLES[severity];
  const Icon = style.icon;
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 flex items-start gap-3",
        style.bg,
        style.border,
        className
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", style.iconCls)} />
      <div className="min-w-0 flex-1">
        {title && (
          <p className={cn("text-xs font-semibold mb-0.5", style.text)}>{title}</p>
        )}
        <p className={cn("text-sm", style.text)}>{message}</p>
      </div>
    </div>
  );
}
