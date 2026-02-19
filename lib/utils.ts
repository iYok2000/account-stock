import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic ฿ formatter — no locale dependency → no SSR/client mismatch */
export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  const [int, dec] = Math.abs(amount).toFixed(2).split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}฿${intFmt}.${dec}`;
}

/** Deterministic number formatter with thousands separator */
export function formatNumber(value: number, decimals = 2): string {
  const [int, dec] = Math.abs(value).toFixed(decimals).split(".");
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals > 0 ? `${intFmt}.${dec}` : intFmt;
}

export function formatPercent(value: number, decimals = 2): string {
  return `${formatNumber(value, decimals)}%`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}
