import { useState, useEffect } from "react";

/**
 * Debounce a value - returns the debounced version that updates
 * only after the specified delay since the last change.
 *
 * For API calls: use useDebouncedValue with initialValue = null
 * to prevent API call on initial mount.
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a value with custom initial value.
 * Useful for preventing API calls on initial mount by starting with null.
 */
export function useDebouncedValue<T, I = null>(
  value: T,
  delay: number,
  initialValue: I
): T | I {
  const [debouncedValue, setDebouncedValue] = useState<T | I>(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Track whether input is currently being debounced (user is still typing/sliding).
 */
export function useIsDebouncing<T>(value: T, debouncedValue: T): boolean {
  return value !== debouncedValue;
}
