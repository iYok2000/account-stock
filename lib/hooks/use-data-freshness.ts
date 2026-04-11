import { useState, useEffect, useCallback, useRef } from "react";

interface DataFreshnessState {
  /** Timestamp of the last successful data fetch */
  lastUpdatedAt: Date | null;
  /** Human-readable relative time string (e.g., "2 นาทีที่แล้ว") */
  relativeTime: string;
  /** Whether the data is considered stale (>1 hour old) */
  isStale: boolean;
  /** Whether auto-refresh is enabled */
  autoRefreshEnabled: boolean;
  /** Whether a refresh is currently in progress */
  isRefreshing: boolean;
  /** Toggle auto-refresh on/off */
  toggleAutoRefresh: () => void;
  /** Trigger a manual refresh */
  refresh: () => void;
  /** Mark that data was just fetched (call after successful fetch) */
  markUpdated: () => void;
}

const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
const AUTO_REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const RELATIVE_TIME_UPDATE_MS = 15_000; // Update relative time every 15s

function formatRelativeTime(date: Date | null): string {
  if (!date) return "ยังไม่โหลดข้อมูล";

  const now = Date.now();
  const diffMs = now - date.getTime();

  if (diffMs < 0) return "เพิ่งอัปเดต";

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 10) return "เพิ่งอัปเดต";
  if (seconds < 60) return `${seconds} วินาทีที่แล้ว`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} นาทีที่แล้ว`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`;

  const days = Math.floor(hours / 24);
  return `${days} วันที่แล้ว`;
}

/**
 * Hook that tracks data freshness for a dashboard page.
 *
 * @param onRefresh - Async callback that re-fetches the data (e.g., queryClient.invalidateQueries)
 * @param dataUpdatedAt - Optional timestamp from react-query's dataUpdatedAt
 */
export function useDataFreshness(
  onRefresh: () => Promise<void> | void,
  dataUpdatedAt?: number,
): DataFreshnessState {
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(
    dataUpdatedAt ? new Date(dataUpdatedAt) : null,
  );
  const [relativeTime, setRelativeTime] = useState(() =>
    formatRelativeTime(lastUpdatedAt),
  );
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Sync with external dataUpdatedAt (from react-query)
  useEffect(() => {
    if (dataUpdatedAt) {
      setLastUpdatedAt(new Date(dataUpdatedAt));
    }
  }, [dataUpdatedAt]);

  // Update relative time periodically
  useEffect(() => {
    const update = () => setRelativeTime(formatRelativeTime(lastUpdatedAt));
    update();
    const interval = setInterval(update, RELATIVE_TIME_UPDATE_MS);
    return () => clearInterval(interval);
  }, [lastUpdatedAt]);

  const isStale =
    lastUpdatedAt !== null &&
    Date.now() - lastUpdatedAt.getTime() > STALE_THRESHOLD_MS;

  const markUpdated = useCallback(() => {
    setLastUpdatedAt(new Date());
  }, []);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefresh();
      setLastUpdatedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  const toggleAutoRefresh = useCallback(() => {
    setAutoRefreshEnabled((prev) => !prev);
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshEnabled) {
      autoRefreshRef.current = setInterval(() => {
        refresh();
      }, AUTO_REFRESH_INTERVAL_MS);
    } else if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = null;
    }

    return () => {
      if (autoRefreshRef.current) {
        clearInterval(autoRefreshRef.current);
        autoRefreshRef.current = null;
      }
    };
  }, [autoRefreshEnabled, refresh]);

  return {
    lastUpdatedAt,
    relativeTime,
    isStale,
    autoRefreshEnabled,
    isRefreshing,
    toggleAutoRefresh,
    refresh,
    markUpdated,
  };
}
