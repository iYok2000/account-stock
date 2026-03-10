"use client";

import { useState, useCallback, useRef } from "react";
import { Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";

function fmt(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** ตำแหน่ง bubble เหนือ thumb — ชดเชยความกว้าง thumb ≈ 22px */
function bubbleOffset(pct: number) {
  return `calc(${pct}% + ${11 - pct * 0.22}px)`;
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
  /** Short description shown below slider */
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
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef                = useRef<HTMLInputElement>(null);

  const pct = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;

  // ─── filled track style ───────────────────────────────────────────────────
  const trackStyle = {
    background: `linear-gradient(to right, hsl(var(--primary)) ${pct}%, hsl(var(--border)) ${pct}%)`,
  } as React.CSSProperties;

  // ─── tap-to-edit ──────────────────────────────────────────────────────────
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
      if (e.key === "Enter") { commitEdit(); inputRef.current?.blur(); }
      if (e.key === "Escape") setEditing(false);
    },
    [commitEdit]
  );

  return (
    <div className={cn("space-y-1", locked && "opacity-60")}>

      {/* Label + editable value */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-foreground truncate">{label}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {editing ? (
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-28 rounded-lg border border-primary bg-background px-2.5 py-1 text-right text-sm font-semibold tabular-nums text-primary shadow-sm outline-none ring-2 ring-primary/30"
            />
          ) : (
            <button
              type="button"
              onClick={startEdit}
              disabled={locked}
              className="min-h-[36px] rounded-lg bg-primary/10 px-3 py-1 text-sm font-bold tabular-nums text-primary transition-all duration-150 hover:bg-primary/15 active:scale-95 active:bg-primary/20 disabled:cursor-not-allowed disabled:active:scale-100"
              title="แตะเพื่อพิมพ์ค่า"
            >
              {prefix}{fmt(value)}{suffix}
            </button>
          )}
          {showLock && (
            <button
              type="button"
              onClick={onLockToggle}
              className={cn(
                "h-9 w-9 flex items-center justify-center rounded-lg transition-all duration-150 active:scale-90",
                locked
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-muted-foreground hover:bg-muted"
              )}
              title={locked ? "ปลดล็อค" : "ล็อคค่านี้"}
            >
              {locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Slider track + floating bubble */}
      <div className="relative pt-6 pb-1">

        {/* Floating value bubble — ลอยเหนือ thumb */}
        <div
          className={cn(
            "pointer-events-none absolute top-0 -translate-x-1/2 transition-opacity duration-150",
            dragging ? "opacity-100" : "opacity-0"
          )}
          style={{ left: bubbleOffset(pct) }}
        >
          <span className="inline-flex items-center rounded-md bg-primary px-2 py-0.5 text-[11px] font-bold tabular-nums text-primary-foreground shadow-md whitespace-nowrap">
            {prefix}{fmt(value)}{suffix}
          </span>
          {/* Arrow down */}
          <span className="block h-1.5 w-1.5 rotate-45 bg-primary mx-auto -mt-px shadow-sm" />
        </div>

        {/* Range input */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          disabled={locked}
          style={trackStyle}
          onMouseDown={() => setDragging(true)}
          onMouseUp={() => setDragging(false)}
          onTouchStart={() => setDragging(true)}
          onTouchEnd={() => setDragging(false)}
          onChange={(e) => onChange(Number(e.target.value))}
          className={cn(
            "w-full h-3 cursor-pointer rounded-full appearance-none transition-opacity",
            "disabled:cursor-not-allowed disabled:opacity-40",
            // Thumb: ใหญ่ขึ้นบน mobile
            "[&::-webkit-slider-thumb]:appearance-none",
            "[&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6",
            "[&::-webkit-slider-thumb]:rounded-full",
            "[&::-webkit-slider-thumb]:bg-primary",
            "[&::-webkit-slider-thumb]:shadow-md",
            "[&::-webkit-slider-thumb]:cursor-pointer",
            "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white",
            "[&::-webkit-slider-thumb]:transition-transform",
            "[&::-webkit-slider-thumb]:active:scale-110",
            "[&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:w-6",
            "[&::-moz-range-thumb]:rounded-full",
            "[&::-moz-range-thumb]:bg-primary",
            "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white",
            "[&::-moz-range-thumb]:cursor-pointer",
            "[&::-moz-range-thumb]:shadow-md",
          )}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between text-[11px] text-muted-foreground/70 tabular-nums">
        <span>{prefix}{fmt(min)}{suffix}</span>
        <span>{prefix}{fmt(max)}{suffix}</span>
      </div>

      {/* Hint */}
      {hint && (
        <p className="text-[11px] text-muted-foreground/75 leading-tight">{hint}</p>
      )}
    </div>
  );
}
