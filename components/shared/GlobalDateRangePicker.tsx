"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Locale helpers ───────────────────────────────────────────────────────────

const MONTH_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน",
  "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม",
  "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
const MONTH_SHORT = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.",
  "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.",
  "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];
const DAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function daysAgoISO(n: number): string {
  const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
}
function startOfMonthISO(offset = 0): string {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset); return d.toISOString().slice(0, 10);
}
function endOfMonthISO(offset = 0): string {
  const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + offset + 1); d.setDate(0);
  return d.toISOString().slice(0, 10);
}
function isoToYMD(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}
function ymdToISO(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
function addMonths(y: number, m: number, delta: number): [number, number] {
  const d = new Date(y, m - 1 + delta, 1);
  return [d.getFullYear(), d.getMonth() + 1];
}
function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}
function firstDayOfWeek(y: number, m: number): number {
  return new Date(y, m - 1, 1).getDay(); // 0=Sun
}
function countDays(start: string, end: string): number {
  if (!start || !end) return 0;
  return Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000)) + 1;
}
function formatDisplay(iso: string): string {
  if (!iso) return "—";
  const [y, m, d] = isoToYMD(iso);
  return `${String(d).padStart(2, "0")} ${MONTH_SHORT[m - 1]} ${y}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DateRange { startDate: string; endDate: string; }

export interface GlobalDateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
  maxDate?: string;
  placeholder?: string;
}

// ─── Preset list ─────────────────────────────────────────────────────────────

interface Preset { label: string; fn: () => DateRange; }
const PRESETS: Preset[] = [
  { label: "7 วัน",     fn: () => ({ startDate: daysAgoISO(6),  endDate: todayISO() }) },
  { label: "14 วัน",    fn: () => ({ startDate: daysAgoISO(13), endDate: todayISO() }) },
  { label: "30 วัน",    fn: () => ({ startDate: daysAgoISO(29), endDate: todayISO() }) },
  { label: "90 วัน",    fn: () => ({ startDate: daysAgoISO(89), endDate: todayISO() }) },
  { label: "เดือนนี้",  fn: () => ({ startDate: startOfMonthISO(0),  endDate: todayISO() }) },
  { label: "เดือนก่อน", fn: () => ({ startDate: startOfMonthISO(-1), endDate: endOfMonthISO(-1) }) },
  { label: "3 เดือนที่แล้ว", fn: () => ({ startDate: startOfMonthISO(-3), endDate: endOfMonthISO(-1) }) },
];

function isPresetActive(preset: Preset, value: DateRange): boolean {
  const r = preset.fn();
  return r.startDate === value.startDate && r.endDate === value.endDate;
}

// ─── Calendar month grid ──────────────────────────────────────────────────────

function CalendarMonth({
  year,
  month,
  selStart,
  selEnd,
  hoverDate,
  onDayClick,
  onDayHover,
  maxDate,
}: {
  year: number;
  month: number;
  selStart: string | null;
  selEnd: string | null;
  hoverDate: string | null;
  onDayClick: (iso: string) => void;
  onDayHover: (iso: string | null) => void;
  maxDate: string;
}) {
  const days = daysInMonth(year, month);
  const startPad = firstDayOfWeek(year, month);
  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  // pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null);

  const rangeEnd = selStart && !selEnd ? hoverDate : selEnd;

  const getState = (iso: string) => {
    const isStart = iso === selStart;
    const isEnd = iso === (selEnd ?? (selStart && hoverDate ? hoverDate : null));
    const lo = selStart && rangeEnd ? (selStart < rangeEnd ? selStart : rangeEnd) : null;
    const hi = selStart && rangeEnd ? (selStart < rangeEnd ? rangeEnd : selStart) : null;
    const inRange = lo && hi ? iso > lo && iso < hi : false;
    const isToday = iso === todayISO();
    const isDisabled = iso > maxDate;
    return { isStart, isEnd, inRange, isToday, isDisabled };
  };

  return (
    <div className="select-none">
      {/* Month title */}
      <p className="text-sm font-semibold text-foreground text-center mb-3">
        {MONTH_FULL[month - 1]} {year}
      </p>

      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1 gap-px">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-[10px] sm:text-[11px] font-semibold text-muted-foreground py-0.5 sm:py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-px max-w-[16rem] sm:max-w-none mx-auto sm:mx-0">
        {cells.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;
          const iso = ymdToISO(year, month, day);
          const { isStart, isEnd, inRange, isToday, isDisabled } = getState(iso);
          const isEdge = isStart || isEnd;
          const bothEdge = isStart && isEnd;

          return (
            <div
              key={iso}
              className={cn(
                "relative flex items-center justify-center h-8 sm:h-9",
                // range background strip (only inner days)
                inRange && "bg-primary/10",
                // half-strip on edges
                isStart && selEnd && selEnd !== selStart && "bg-linear-to-r from-transparent to-primary/10",
                isEnd && selStart && selEnd !== selStart && "bg-linear-to-l from-transparent to-primary/10",
                bothEdge && "bg-transparent",
              )}
            >
              <button
                type="button"
                disabled={isDisabled}
                onClick={() => !isDisabled && onDayClick(iso)}
                onMouseEnter={() => !isDisabled && onDayHover(iso)}
                onMouseLeave={() => onDayHover(null)}
                className={cn(
                  "w-8 h-8 sm:w-9 sm:h-9 rounded-full text-xs sm:text-sm transition-all duration-100 font-medium z-10",
                  "flex items-center justify-center",
                  // default
                  !isEdge && !inRange && !isDisabled && "hover:bg-primary/15 hover:text-primary text-foreground",
                  // in-range non-edge
                  inRange && !isEdge && "text-primary hover:bg-primary/20",
                  // edge (start/end)
                  isEdge && "bg-primary text-white hover:bg-primary/90 shadow-sm",
                  // today ring
                  isToday && !isEdge && "ring-1 ring-primary ring-offset-1 text-primary font-bold",
                  // disabled
                  isDisabled && "opacity-30 cursor-not-allowed text-muted-foreground",
                )}
              >
                {day}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function GlobalDateRangePicker({
  value,
  onChange,
  className,
  maxDate,
  placeholder = "เลือกช่วงวันที่",
}: GlobalDateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingStart, setPendingStart] = useState<string | null>(null);
  const [pendingEnd, setPendingEnd] = useState<string | null>(null);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [phase, setPhase] = useState<"idle" | "selecting-end">("idle");

  const today = todayISO();
  const max = maxDate ?? today;
  const wrapperRef = useRef<HTMLDivElement>(null);

  // default left month = month of current start
  const initialMonth = useMemo((): [number, number] => {
    const s = pendingStart ?? value.startDate;
    if (!s) { const now = new Date(); return [now.getFullYear(), now.getMonth() + 1]; }
    const [y, m] = isoToYMD(s);
    return [y, m];
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const [leftYear, setLeftYear] = useState(initialMonth[0]);
  const [leftMonth, setLeftMonth] = useState(initialMonth[1]);
  const [rightYear, rightMonth] = useMemo(() => addMonths(leftYear, leftMonth, 1), [leftYear, leftMonth]);

  // Sync pending state when opening
  useEffect(() => {
    if (open) {
      setPendingStart(value.startDate || null);
      setPendingEnd(value.endDate || null);
      setPhase("idle");
      setHoverDate(null);
      // navigate to start month
      if (value.startDate) {
        const [y, m] = isoToYMD(value.startDate);
        setLeftYear(y);
        setLeftMonth(m);
      }
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const handleDayClick = useCallback((iso: string) => {
    if (phase === "idle" || phase === "selecting-end" && !pendingStart) {
      setPendingStart(iso);
      setPendingEnd(null);
      setPhase("selecting-end");
    } else {
      // second click
      const s = pendingStart!;
      const [start, end] = s <= iso ? [s, iso] : [iso, s];
      setPendingStart(start);
      setPendingEnd(end);
      setPhase("idle");
    }
  }, [phase, pendingStart]);

  const handleApply = () => {
    if (pendingStart && pendingEnd) {
      onChange({ startDate: pendingStart, endDate: pendingEnd });
    } else if (pendingStart && !pendingEnd) {
      onChange({ startDate: pendingStart, endDate: pendingStart });
    }
    setOpen(false);
  };

  const handleCancel = () => setOpen(false);

  const handlePreset = (preset: Preset) => {
    const r = preset.fn();
    setPendingStart(r.startDate);
    setPendingEnd(r.endDate);
    setPhase("idle");
    // navigate calendar to preset start
    const [y, m] = isoToYMD(r.startDate);
    setLeftYear(y);
    setLeftMonth(m);
  };

  const prevMonth = () => {
    const [y, m] = addMonths(leftYear, leftMonth, -1);
    setLeftYear(y); setLeftMonth(m);
  };
  const nextMonth = () => {
    const [y, m] = addMonths(leftYear, leftMonth, 1);
    setLeftYear(y); setLeftMonth(m);
  };

  const days = countDays(value.startDate, value.endDate);
  const hasValue = value.startDate && value.endDate;
  const isDefault = value.startDate === daysAgoISO(29) && value.endDate === today;

  // Displayed range in pending state for indicator
  const dispStart = pendingStart;
  const dispEnd = pendingEnd ?? (phase === "selecting-end" && hoverDate ? hoverDate : null);

  return (
    <div ref={wrapperRef} className={cn("relative inline-block w-full sm:w-auto", className)}>
      {/* ── Trigger button ─────────────────────────── */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5 sm:px-4",
          "text-sm font-medium text-foreground hover:border-primary/50 hover:bg-card",
          "transition-all duration-150 shadow-sm w-full min-w-0 sm:min-w-[260px]",
          open && "border-primary ring-2 ring-primary/20"
        )}
      >
        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
        <span className="flex-1 text-left min-w-0 truncate">
          {hasValue ? (
            <span className="truncate inline-flex items-center flex-wrap gap-x-1">
              <span className="text-foreground truncate">{formatDisplay(value.startDate)}</span>
              <span className="text-muted-foreground shrink-0">→</span>
              <span className="text-foreground truncate">{formatDisplay(value.endDate)}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </span>
        {days > 0 && (
          <span className="text-[11px] bg-primary/10 text-primary font-semibold px-2 py-0.5 rounded-full tabular-nums whitespace-nowrap shrink-0">
            {days} วัน
          </span>
        )}
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open && "rotate-180")} />
      </button>

      {/* ── Dropdown panel ─────────────────────────── */}
      {open && (
        <div className={cn(
          "absolute z-50 top-full left-0 mt-2",
          "bg-card border border-border rounded-2xl shadow-xl",
          "flex flex-col md:flex-row overflow-hidden",
          "w-[calc(100vw-1.5rem)] max-w-[95vw] md:min-w-[720px] md:max-w-none",
        )}>
          {/* Presets: horizontal scroll on mobile, sidebar on desktop */}
          <div className="md:w-36 md:shrink-0 md:border-r border-border p-3 flex flex-row md:flex-col gap-2 md:gap-0.5 bg-muted/30 overflow-x-auto md:overflow-visible md:flex-nowrap shrink-0 border-b md:border-b-0">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide md:px-2 mb-0 md:mb-2 shrink-0 md:shrink-none self-center md:self-auto md:w-full">
              ช่วงด่วน
            </p>
            <div className="flex md:flex-col gap-1.5 md:gap-0.5 flex-1 min-w-0">
              {PRESETS.map((preset) => {
                const active = pendingStart && pendingEnd
                  ? (() => { const r = preset.fn(); return r.startDate === pendingStart && r.endDate === pendingEnd; })()
                  : isPresetActive(preset, value);
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handlePreset(preset)}
                    className={cn(
                      "shrink-0 md:shrink-none text-xs px-2.5 py-2 rounded-lg font-medium transition-colors md:w-full md:text-left",
                      active
                        ? "bg-primary text-white"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Reset */}
            {!isDefault && (
              <>
                <div className="my-2 border-t border-border hidden md:block w-full" />
                <button
                  type="button"
                  onClick={() => handlePreset({ label: "", fn: () => ({ startDate: daysAgoISO(29), endDate: today }) })}
                  className="shrink-0 md:shrink-none w-full text-left text-xs px-2.5 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground flex items-center justify-center md:justify-start gap-1.5 transition-colors mt-2 md:mt-0"
                >
                  <RotateCcw className="h-3 w-3" />
                  รีเซ็ต
                </button>
              </>
            )}
          </div>

          {/* Right: calendar + footer */}
          <div className="flex flex-col p-3 sm:p-4 flex-1 min-w-0">
            {/* Status bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4 text-xs text-muted-foreground">
              {phase === "selecting-end" ? (
                <span className="text-primary font-medium animate-pulse">
                  เลือกวันสิ้นสุด…
                </span>
              ) : dispStart && dispEnd ? (
                <span className="min-w-0 truncate">
                  <span className="font-semibold text-foreground">{formatDisplay(dispStart)}</span>
                  <span className="mx-1.5">→</span>
                  <span className="font-semibold text-foreground">{formatDisplay(dispEnd)}</span>
                  <span className="ml-1 sm:ml-2 text-muted-foreground">
                    ({countDays(
                      dispStart < dispEnd ? dispStart : dispEnd,
                      dispStart < dispEnd ? dispEnd : dispStart
                    )} วัน)
                  </span>
                </span>
              ) : (
                <span>เลือกวันเริ่มต้น</span>
              )}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="เดือนก่อน"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  aria-label="เดือนถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Calendar: one month on mobile, two on desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <CalendarMonth
                year={leftYear}
                month={leftMonth}
                selStart={pendingStart}
                selEnd={pendingEnd}
                hoverDate={hoverDate}
                onDayClick={handleDayClick}
                onDayHover={setHoverDate}
                maxDate={max}
              />
              <div className="hidden md:block">
                <CalendarMonth
                  year={rightYear}
                  month={rightMonth}
                  selStart={pendingStart}
                  selEnd={pendingEnd}
                  hoverDate={hoverDate}
                  onDayClick={handleDayClick}
                  onDayHover={setHoverDate}
                  maxDate={max}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border flex-wrap">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={!pendingStart}
                className={cn(
                  "px-5 py-2 text-sm font-semibold rounded-lg transition-all",
                  pendingStart
                    ? "bg-primary text-white hover:bg-primary/90 shadow-sm"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                )}
              >
                {pendingStart && pendingEnd
                  ? `นำไปใช้ (${countDays(
                      pendingStart < pendingEnd ? pendingStart : pendingEnd,
                      pendingStart < pendingEnd ? pendingEnd : pendingStart
                    )} วัน)`
                  : "นำไปใช้"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── URL-synced variant ───────────────────────────────────────────────────────

import { usePathname, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

export interface UrlDateRangePickerProps
  extends Omit<GlobalDateRangePickerProps, "value" | "onChange"> {}

export function UrlDateRangePicker(props: UrlDateRangePickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const startDate = searchParams.get("startDate") ?? daysAgoISO(29);
  const endDate = searchParams.get("endDate") ?? todayISO();

  const handleChange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("startDate", range.startDate);
    params.set("endDate", range.endDate);
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <GlobalDateRangePicker
      value={{ startDate, endDate }}
      onChange={handleChange}
      {...props}
    />
  );
}
