import type { DailyRow, ImportTier, OrderTransactionSummary, SkuRow } from "@/components/upload/file-parser";

export type ImportSnapshot = {
  shopId: string | null;
  updatedAt: string; // ISO string
  tier: ImportTier;
  summary: OrderTransactionSummary;
  daily?: DailyRow[];
  items?: SkuRow[];
};

const STORAGE_KEY = "import_snapshot_v1";

function getStore(): Record<string, ImportSnapshot> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, ImportSnapshot>;
  } catch {
    return {};
  }
}

export function loadImportSnapshot(shopId: string | null | undefined): ImportSnapshot | null {
  const store = getStore();
  const key = shopId ?? "root";
  return store[key] ?? null;
}

export function saveImportSnapshot(snapshot: ImportSnapshot) {
  if (typeof window === "undefined") return;
  const store = getStore();
  const key = snapshot.shopId ?? "root";
  store[key] = snapshot;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore write errors (storage may be unavailable)
  }
}
