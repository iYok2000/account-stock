"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Boxes,
  RefreshCw,
  ArrowDownToLine,
  AlertCircle,
  Search,
  Coins,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useInventory } from "@/lib/hooks/use-api";

const STORAGE_KEY = "calculator:cost-per-sku";

type InventoryPickerProps = {
  priceMode: "list" | "selling";
  currentProductCost: number;
  setListPrice: (v: number) => void;
  setSellingPrice: (v: number) => void;
  setQuantity: (v: number) => void;
  setProductCost: (v: number) => void;
};

type InventoryRow = {
  key: string;
  name: string;
  sku: string;
  quantity: number;
  revenue?: number;
  net?: number;
};

function deriveUnitPrices(row: InventoryRow) {
  const qty = Math.max(1, Math.round(row.quantity || 0));
  const revenuePerUnit = qty > 0 ? (row.revenue ?? 0) / qty : 0;
  const netPerUnit = qty > 0 ? (row.net ?? 0) / qty : 0;
  return { qty, revenuePerUnit, netPerUnit };
}

export function InventoryPicker(props: InventoryPickerProps) {
  const t = useTranslations("calculator.inventoryPicker");
  const [search, setSearch] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [costMemory, setCostMemory] = useState<Record<string, number>>({});
  const [costInput, setCostInput] = useState("");

  const inventoryQuery = useInventory({ limit: 100 });
  const items: InventoryRow[] = useMemo(() => {
    const rows = inventoryQuery.data?.data ?? [];
    return rows.map((row, idx) => ({
      key: row.sku || row.id || `row-${idx}`,
      name: row.name || row.product_name || row.sku || `SKU-${idx + 1}`,
      sku: row.sku || row.seller_sku || row.id || `SKU-${idx + 1}`,
      quantity: row.quantity ?? 0,
      revenue: row.revenue ?? undefined,
      net: row.net ?? undefined,
    }));
  }, [inventoryQuery.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(term) ||
        i.sku.toLowerCase().includes(term)
    );
  }, [items, search]);

  const selected =
    filtered.find((i) => i.key === selectedKey) ??
    (filtered.length > 0 ? filtered[0] : null);

  // Load cached cost per SKU
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setCostMemory(JSON.parse(raw));
    } catch {
      // ignore corrupted cache
    }
  }, []);

  // Update selectedKey when data arrives
  useEffect(() => {
    if (!selectedKey && filtered.length > 0) {
      setSelectedKey(filtered[0].key);
    }
  }, [filtered, selectedKey]);

  // Sync cost input from cache or current product cost when selection changes
  useEffect(() => {
    if (!selected) return;
    const cached = costMemory[selected.sku];
    if (typeof cached === "number") {
      setCostInput(cached.toString());
      return;
    }
    if (props.currentProductCost > 0) {
      setCostInput(props.currentProductCost.toString());
    } else {
      setCostInput("");
    }
  }, [selected, costMemory, props.currentProductCost]);

  const handleApply = () => {
    if (!selected) return;
    const { qty, revenuePerUnit, netPerUnit } = deriveUnitPrices(selected);
    const price = Math.max(
      0,
      Math.round(((revenuePerUnit || netPerUnit || 0) + Number.EPSILON) * 100) /
        100
    );
    const listPrice = price;
    const cost = parseFloat(costInput);
    props.setQuantity(qty);
    props.setSellingPrice(price);
    props.setListPrice(listPrice);
    if (!Number.isNaN(cost) && cost >= 0) {
      props.setProductCost(Math.round(cost * 100) / 100);
      const next = { ...costMemory, [selected.sku]: Math.round(cost * 100) / 100 };
      setCostMemory(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    }
  };

  const renderState = () => {
    if (inventoryQuery.isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          {t("loading")}
        </div>
      );
    }
    if (inventoryQuery.isError) {
      return (
        <div className="flex items-center gap-2 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" />
          {t("loadError")}
          <button
            type="button"
            onClick={() => inventoryQuery.refetch()}
            className="ml-auto text-xs font-medium text-primary hover:underline"
          >
            {t("retry")}
          </button>
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Boxes className="h-4 w-4" />
          {t("noData")}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="card space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="input-base w-48 pl-8"
            />
          </div>
          <button
            type="button"
            onClick={() => inventoryQuery.refetch()}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-3 py-2 text-xs font-medium text-foreground hover:bg-card"
          >
            <RefreshCw className="h-4 w-4" />
            {t("refresh")}
          </button>
        </div>
      </div>

      {renderState()}

      {filtered.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {filtered.slice(0, 6).map((item) => {
            const { qty, revenuePerUnit, netPerUnit } = deriveUnitPrices(item);
            const active = selected?.key === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setSelectedKey(item.key)}
                className={cn(
                  "rounded-lg border px-3 py-3 text-left shadow-sm transition hover:border-primary/80 hover:shadow",
                  active
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.sku}
                    </p>
                  </div>
                  <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                    {t("qty", { count: qty })}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>{t("revenuePerUnit")}: <strong className="text-foreground">{formatCurrency(revenuePerUnit)}</strong></span>
                  {netPerUnit > 0 && (
                    <span>{t("netPerUnit")}: <strong className="text-foreground">{formatCurrency(netPerUnit)}</strong></span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-dashed border-border bg-muted/40 p-3 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            {t("costLabel")}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              placeholder={t("costPlaceholder")}
              className="input-base w-full sm:w-48"
            />
            <div className="text-xs text-muted-foreground sm:flex-1">
              {t("costHint")}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">
              {t("applyHint", { mode: props.priceMode === "selling" ? t("priceSelling") : t("priceList") })}
            </div>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow hover:bg-primary/90"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {t("apply")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
