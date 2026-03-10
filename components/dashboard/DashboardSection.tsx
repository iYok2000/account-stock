"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

const STORAGE_PREFIX = "dashboard-section";

export interface DashboardSectionProps {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  summary?: string;
  warningBadge?: string;
  chartCount?: number;
  children: React.ReactNode;
  className?: string;
}

function getDefaultOpen(id: string, defaultOpen: boolean): boolean {
  if (typeof window === "undefined") return defaultOpen;
  try {
    const key = `${STORAGE_PREFIX}-${id}-expanded`;
    const saved = localStorage.getItem(key);
    return saved !== null ? saved === "true" : defaultOpen;
  } catch {
    return defaultOpen;
  }
}

function setStoredOpen(id: string, open: boolean): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}-${id}-expanded`, String(open));
  } catch {
    // ignore
  }
}

export function DashboardSection({
  id,
  title,
  description,
  icon,
  defaultOpen = false,
  summary,
  warningBadge,
  chartCount,
  children,
  className = "",
}: DashboardSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    setIsOpen(getDefaultOpen(id, defaultOpen));
  }, [id, defaultOpen, mounted]);

  useEffect(() => {
    if (!mounted) return;
    setStoredOpen(id, isOpen);
  }, [id, isOpen, mounted]);

  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <section
      id={id}
      className={`mb-6 ${className}`}
      aria-labelledby={`${id}-heading`}
    >
      <button
        type="button"
        onClick={toggle}
        className={`
          w-full flex items-center justify-between gap-3
          min-h-[44px] px-4 py-4 md:px-6 md:py-4
          ${isOpen ? "bg-muted/40" : "bg-card"}
          border border-border
          ${isOpen ? "rounded-t-lg" : "rounded-lg"}
          hover:bg-muted/50 hover:border-[hsl(var(--border))]
          focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2
          transition-all duration-200 text-left
        `}
        aria-expanded={isOpen}
        aria-controls={`${id}-content`}
        aria-label={isOpen ? `ยุบ ${title}` : `ขยาย ${title}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="text-primary w-5 h-5 shrink-0 [&>svg]:w-5 [&>svg]:h-5">
              {icon}
            </span>
          )}
          <h2
            id={`${id}-heading`}
            className={`
              text-base md:text-lg font-semibold truncate
              ${isOpen ? "text-foreground" : "text-foreground"}
            `}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {!isOpen && summary && (
            <span className="hidden md:block text-sm text-muted-foreground truncate max-w-[200px]">
              {summary}
            </span>
          )}
          {warningBadge && (
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full whitespace-nowrap">
              {warningBadge}
            </span>
          )}
          {chartCount != null && !isOpen && (
            <span className="hidden sm:flex items-center text-xs bg-muted text-foreground px-2 py-1 rounded-full">
              {chartCount} รายการ
            </span>
          )}
          <ChevronDown
            className={`
              w-5 h-5 text-muted-foreground shrink-0
              transition-transform duration-300
              ${isOpen ? "rotate-0" : "-rotate-90"}
            `}
            aria-hidden
          />
        </div>
      </button>

      <div
        id={`${id}-content`}
        ref={contentRef}
        role="region"
        aria-labelledby={`${id}-heading`}
        aria-hidden={!isOpen}
        className={`
          overflow-hidden
          transition-all duration-300 ease-in-out
          ${isOpen ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="bg-muted/40 border-x border-b border-border rounded-b-lg p-4 md:p-6">
          {description && (
            <p className="text-sm text-muted-foreground mb-6">{description}</p>
          )}
          <div className="space-y-6">{children}</div>
        </div>
      </div>
    </section>
  );
}
