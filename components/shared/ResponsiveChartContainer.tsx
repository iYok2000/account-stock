"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { cn } from "@/lib/utils";

export interface ResponsiveChartContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Chart aspect ratio for consistent sizing (width/height). Overrides height breakpoints when set. */
  aspectRatio?: number;
  /** Override default height breakpoints (in pixels) */
  heightBreakpoints?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
}

/**
 * ResponsiveChartContainer
 *
 * Wraps charts with responsive height management based on viewport size.
 * Ensures optimal chart viewing experience across mobile, tablet, and desktop.
 *
 * Default heights:
 * - Mobile (< 768px): 200px
 * - Tablet (768-1024px): 300px
 * - Desktop (> 1024px): 400px
 *
 * Features:
 * - Auto-adjust height on viewport resize
 * - Maintains aspect ratio when specified
 * - Smooth resize transitions
 */
export function ResponsiveChartContainer({
  children,
  className = "",
  aspectRatio,
  heightBreakpoints = {},
}: ResponsiveChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number>(400);

  const defaultBreakpoints = useMemo(() => ({
    mobile: heightBreakpoints.mobile ?? 200,
    tablet: heightBreakpoints.tablet ?? 300,
    desktop: heightBreakpoints.desktop ?? 400,
  }), [heightBreakpoints.mobile, heightBreakpoints.tablet, heightBreakpoints.desktop]);

  useEffect(() => {
    const updateHeight = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.offsetWidth;
      const viewportWidth = window.innerWidth;

      let newHeight: number;

      if (viewportWidth < 768) {
        newHeight = defaultBreakpoints.mobile;
      } else if (viewportWidth < 1024) {
        newHeight = defaultBreakpoints.tablet;
      } else {
        newHeight = defaultBreakpoints.desktop;
      }

      // Apply aspect ratio if specified
      if (aspectRatio) {
        newHeight = width / aspectRatio;
      }

      setHeight(newHeight);
    };

    // Initial calculation
    updateHeight();

    // Update on resize with debounce
    let timeoutId: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateHeight, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [aspectRatio, defaultBreakpoints]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "transition-all duration-300 ease-out",
        className
      )}
      style={{ height: `${height}px` }}
      role="img"
      aria-label="กราฟแสดงข้อมูล"
    >
      {children}
    </div>
  );
}
