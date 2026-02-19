"use client";

import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

interface SliderProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  /** Show lock toggle button */
  showLock?: boolean;
  locked?: boolean;
  onLockToggle?: () => void;
}

export function Slider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  showLock,
  locked,
  onLockToggle,
}: SliderProps) {
  return (
    <div className={cn("space-y-1.5", locked && "opacity-60")}>
      <div className="flex items-center justify-between text-sm gap-2">
        <span className="font-medium text-foreground truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          <span className="font-semibold text-primary tabular-nums">
            {prefix}{fmt(value)}{suffix}
          </span>
          {showLock && (
            <button
              type="button"
              onClick={onLockToggle}
              className={cn(
                "rounded p-1 transition-colors",
                locked
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={locked ? "ปลดล็อค" : "ล็อคค่านี้"}
            >
              {locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={locked}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 cursor-pointer accent-primary disabled:cursor-not-allowed"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prefix}{fmt(min)}{suffix}</span>
        <span>{prefix}{fmt(max)}{suffix}</span>
      </div>
    </div>
  );
}
