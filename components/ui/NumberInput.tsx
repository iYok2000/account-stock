"use client";

import { useCallback, useRef, useEffect } from "react";

type NumberInputProps = {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  className?: string;
  /** Label for accessibility (aria-label) */
  label?: string;
};

export default function NumberInput({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  placeholder,
  disabled = false,
  error = false,
  className = "",
  label,
}: NumberInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clamp = useCallback(
    (n: number) => {
      let v = n;
      if (min !== undefined && v < min) v = min;
      if (max !== undefined && v > max) v = max;
      return v;
    },
    [min, max]
  );

  const adjust = useCallback(
    (delta: number) => {
      const current = parseFloat(value) || 0;
      const next = clamp(current + delta);
      onChange(String(next));
    },
    [value, clamp, onChange]
  );

  const stopHold = useCallback(() => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  }, []);

  useEffect(() => () => stopHold(), [stopHold]);

  const startHold = useCallback(
    (delta: number) => {
      adjust(delta);
      holdRef.current = setInterval(() => adjust(delta), 150);
    },
    [adjust]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (raw === "" || raw === "-") {
      onChange(raw);
      return;
    }
    const num = parseFloat(raw);
    if (!isNaN(num)) {
      onChange(raw);
    }
  };

  const handleBlur = () => {
    if (value === "" || value === "-") return;
    const num = parseFloat(value);
    if (isNaN(num)) {
      onChange(String(min ?? 0));
      return;
    }
    onChange(String(clamp(num)));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      adjust(step);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      adjust(-step);
    }
  };

  const borderClass = error
    ? "border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgba(220,38,38,0.1)]"
    : "";

  return (
    <div className={`flex items-stretch ${className}`}>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || (min !== undefined && parseFloat(value) <= min)}
        className="flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-l-md border border-r-0 border-neutral-300 bg-neutral-100 text-lg font-medium text-neutral-700 shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out hover:bg-neutral-200 hover:shadow active:scale-[0.97] active:bg-neutral-300 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        onMouseDown={() => startHold(-step)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => startHold(-step)}
        onTouchEnd={stopHold}
        aria-label="Decrease"
      >
        −
      </button>

      <input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? String(min ?? 0)}
        disabled={disabled}
        aria-label={label}
        className={`input-base min-w-0 flex-1 rounded-none border-x-0 text-center tabular-nums ${borderClass}`}
        style={{ borderLeft: "none", borderRight: "none" }}
      />

      <button
        type="button"
        tabIndex={-1}
        disabled={disabled || (max !== undefined && parseFloat(value) >= max)}
        className="flex w-10 shrink-0 cursor-pointer items-center justify-center rounded-r-md border border-l-0 border-neutral-300 bg-neutral-100 text-lg font-medium text-neutral-700 shadow-sm transition-[transform,box-shadow,background-color] duration-150 ease-out hover:bg-neutral-200 hover:shadow active:scale-[0.97] active:bg-neutral-300 active:shadow-inner disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
        onMouseDown={() => startHold(step)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        onTouchStart={() => startHold(step)}
        onTouchEnd={stopHold}
        aria-label="Increase"
      >
        +
      </button>
    </div>
  );
}
