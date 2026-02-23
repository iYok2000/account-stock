"use client";

import { useState, useCallback } from "react";
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
  showLock?: boolean;
  locked?: boolean;
  onLockToggle?: () => void;
  /** Short description under or on hover (tooltip) */
  hint?: string;
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
  hint,
}: SliderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  const startEdit = useCallback(() => {
    if (locked) return;
    setDraft(String(value));
    setEditing(true);
  }, [locked, value]);

  const commitEdit = useCallback(() => {
    setEditing(false);
    const num = parseFloat(draft);
    if (isNaN(num)) return;
    const clamped = Math.min(max, Math.max(min, num));
    const stepped = Math.round(clamped / step) * step;
    onChange(parseFloat(stepped.toFixed(10)));
  }, [draft, min, max, step, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") commitEdit();
      if (e.key === "Escape") setEditing(false);
    },
    [commitEdit]
  );

  return (
    <div className={cn("space-y-1.5", locked && "opacity-60")}>
      <div className="flex items-center justify-between text-sm gap-2">
        <span className="font-medium text-foreground truncate">{label}</span>
        <div className="flex items-center gap-2 shrink-0">
          {editing ? (
            <input
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-24 rounded border border-primary bg-white px-2 py-0.5 text-right text-sm font-semibold tabular-nums text-primary shadow-sm outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              disabled={locked}
              className="cursor-pointer rounded-md px-2 py-1 font-semibold tabular-nums text-primary shadow-sm transition-[transform,box-shadow,background-color] duration-150 hover:bg-primary/10 hover:shadow active:scale-[0.97] active:bg-primary/15 disabled:cursor-not-allowed disabled:active:scale-100"
              title="คลิกเพื่อพิมพ์ค่า"
            >
              {prefix}{fmt(value)}{suffix}
            </button>
          )}
          {showLock && (
            <button
              type="button"
              onClick={onLockToggle}
              className={cn(
                "rounded-md p-1.5 shadow-sm transition-[transform,box-shadow,background-color] duration-150 active:scale-90",
                locked
                  ? "cursor-pointer text-primary bg-primary/10 hover:bg-primary/20 hover:shadow active:bg-primary/25"
                  : "cursor-pointer text-muted-foreground hover:bg-muted hover:shadow active:bg-neutral-200"
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
        className="w-full h-2.5 cursor-pointer accent-primary transition-opacity disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:shadow-md"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{prefix}{fmt(min)}{suffix}</span>
        <span>{prefix}{fmt(max)}{suffix}</span>
      </div>
      {hint && (
        <p className="text-[11px] text-muted-foreground/80 leading-tight" title={hint}>{hint}</p>
      )}
    </div>
  );
}
