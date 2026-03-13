"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ChartCarouselProps {
  /** จำนวน "หน้า" (แต่ละหน้าคือหนึ่ง chart/section) */
  children: React.ReactNode[];
  /** คลาสของ container */
  className?: string;
  /** ความสูงของแต่ละ slide (default h-[260px]) */
  slideHeight?: string;
}

/**
 * Mobile: แสดงทีละ chart พร้อม dot indicator; swipe/scroll แนวนอน
 * Desktop: แสดงเป็น grid หรือ scroll แนวนอนตาม container
 */
export function ChartCarousel({
  children,
  className,
  slideHeight = "h-[260px]",
}: ChartCarouselProps) {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const count = children.length;

  const scrollToIndex = (i: number) => {
    setIndex(i);
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector(`[data-carousel-index="${i}"]`);
    (card as HTMLElement)?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || count === 0) return;
    const onScroll = () => {
      const scrollLeft = el.scrollLeft;
      const width = el.offsetWidth;
      const i = Math.round(scrollLeft / width);
      if (i >= 0 && i < count) setIndex(i);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [count]);

  if (count === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-1 px-1 md:grid md:grid-cols-2 md:overflow-visible md:snap-none"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {children.map((child, i) => (
          <div
            key={i}
            data-carousel-index={i}
            className={cn(
              "min-w-full snap-start shrink-0 md:min-w-0",
              slideHeight
            )}
          >
            {child}
          </div>
        ))}
      </div>
      {count > 1 && (
        <div className="flex justify-center gap-1.5 md:hidden">
          {children.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Chart ${i + 1} of ${count}`}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                i === index ? "bg-primary" : "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
