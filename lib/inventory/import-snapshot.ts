import { loadImportSnapshot, type ImportSnapshot } from "@/lib/import/storage";

export { ImportSnapshot };

export function loadInventorySnapshot(shopId: string | null | undefined): ImportSnapshot | null {
  return loadImportSnapshot(shopId ?? null);
}
