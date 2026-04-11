"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateAction {
  /** CTA button label */
  label: string;
  /** CTA click handler */
  onClick: () => void;
}

export interface EmptyStateProps {
  /** Icon (lucide-react component or custom node) */
  icon?: React.ReactNode;
  /** Title heading */
  title: string;
  /** Description text below title */
  description?: string;
  /** CTA action (label + onClick) */
  action?: EmptyStateAction;
  /** Additional className */
  className?: string;
}

/**
 * EmptyState displays a "no data" placeholder with an icon, message, and optional CTA button.
 * Mobile-first responsive design using blue primary palette.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-10 px-6",
        "bg-gradient-to-br from-blue-50/50 via-white to-white",
        "border border-dashed border-blue-200 rounded-xl",
        "text-center",
        className
      )}
    >
      {/* Icon */}
      <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 shadow-sm">
        {icon ?? <Inbox className="w-7 h-7 text-blue-400" />}
      </div>

      {/* Title */}
      <h3 className="text-base font-semibold text-blue-700">{title}</h3>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-sm text-blue-500/80 max-w-sm leading-relaxed">
          {description}
        </p>
      )}

      {/* CTA Button */}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "mt-5 inline-flex items-center px-4 py-2.5 text-sm font-medium rounded-lg",
            "bg-blue-600 text-white",
            "hover:bg-blue-700 active:bg-blue-800",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "transition-colors duration-150"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
