"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { BarChart3, Package, TrendingDown, TrendingUp } from "lucide-react";
import { useUserContext } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { loadImportSnapshot, type ImportSnapshot } from "@/lib/import/storage";
import { useInventorySummary } from "@/lib/hooks/use-api";

function getMonthKey(date: string | null) {
  if (!date) return null;
  return date.slice(0, 7); // YYYY-MM
}

export function ImportInsights() {
  const t = useTranslations("dashboard.importInsights");
  const user = useUserContext();
  const [snapshot, setSnapshot] = useState<ImportSnapshot | null>(null);
  const summaryQuery = useInventorySummary();

  const role = user?.role;
  if (!user || (role !== "Admin" && role !== "SuperAdmin")) return null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSnapshot(loadImportSnapshot(user.shopId ?? null));
  }, [user?.shopId]);

  const now = useMemo(() => new Date(), []);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const stats = useMemo(() => {
    // Prefer API summary if available
    if (summaryQuery.data) {
      return {
        uniqueSkus: summaryQuery.data.uniqueSkus ?? 0,
        unitsThisMonth: summaryQuery.data.unitsThisMonth ?? 0,
        revenueThisMonth: summaryQuery.data.revenueThisMonth ?? 0,
        netThisMonth: summaryQuery.data.netThisMonth ?? 0,
        topSkus:
          summaryQuery.data.topSkus?.map((s) => ({
            sku: s.sku,
            name: s.name,
            revenue: s.revenue ?? 0,
            net: s.net ?? 0,
            date: s.date,
            qty: s.quantity ?? 0,
          })) ?? [],
      };
    }

    if (!snapshot) {
      return {
        uniqueSkus: 0,
        unitsThisMonth: 0,
        revenueThisMonth: 0,
        netThisMonth: 0,
        topSkus: [] as { sku: string; name?: string; revenue: number; net: number; date?: string | null; qty: number }[],
      };
    }
    const items = snapshot.items ?? [];
    const itemsThisMonth = items.filter((i) => getMonthKey(i.date) === currentMonthKey);
    const dailyThisMonth = (snapshot.daily ?? []).filter((d) => getMonthKey(d.date) === currentMonthKey);
    const uniqueSkus = new Set(items.map((i) => i.sku_id)).size;
    const unitsThisMonth = itemsThisMonth.reduce((sum, i) => sum + (i.quantity || 0), 0);
    let revenueThisMonth = itemsThisMonth.reduce((sum, i) => sum + (i.revenue || 0), 0);
    let netThisMonth = itemsThisMonth.reduce((sum, i) => sum + (i.net || (i.revenue - i.deductions - i.refund)), 0);

    if (revenueThisMonth === 0 && dailyThisMonth.length > 0) {
      revenueThisMonth = dailyThisMonth.reduce((sum, d) => sum + (d.revenue || 0), 0);
      netThisMonth = dailyThisMonth.reduce((sum, d) => sum + (d.net || 0), 0);
    }

    const topSkus = itemsThisMonth
      .slice()
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 3)
      .map((i) => ({
        sku: i.sku_id,
        name: i.product_name,
        revenue: i.revenue,
        net: i.net,
        date: i.date,
        qty: i.quantity,
      }));

    return { uniqueSkus, unitsThisMonth, revenueThisMonth, netThisMonth, topSkus };
  }, [snapshot, currentMonthKey]);

  if (!snapshot) {
    return (
      <div className="card bg-primary/5 border-primary/20">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-primary">{t("title")}</p>
            <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
          </div>
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{t("noData")}</p>
      </div>
    );
  }

  const lastImportDate =
    summaryQuery.data?.lastImport ??
    snapshot?.summary.dateTo ??
    snapshot?.summary.dateFrom ??
    snapshot?.updatedAt.slice(0, 10);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{t("title")}</p>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-primary" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Package className="h-4 w-4 text-primary" />
            {t("uniqueSkus")}
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {stats.uniqueSkus}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("unitsThisMonth")}
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {stats.unitsThisMonth.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("revenueThisMonth")}
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {formatCurrency(stats.revenueThisMonth)}
          </p>
        </div>
        <div className="rounded-lg border border-border/80 bg-muted/40 p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <TrendingDown className="h-4 w-4 text-amber-600" />
            {t("netThisMonth")}
          </div>
          <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
            {formatCurrency(stats.netThisMonth)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground flex items-center justify-between">
        <span>{t("lastImport")}: <strong className="text-foreground font-semibold">{lastImportDate}</strong></span>
        <span className="hidden sm:inline text-muted-foreground">{t("localOnlyHint")}</span>
      </div>

      {stats.topSkus.length > 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{t("topSkus")}</p>
          <div className="divide-y rounded-lg border border-border/80 bg-card">
            {stats.topSkus.map((sku) => (
              <div key={`${sku.sku}-${sku.date ?? "na"}`} className="flex items-center justify-between gap-3 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {sku.name || sku.sku}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {sku.sku} · {sku.date ?? t("unknownDate")} · {t("qty", { count: sku.qty })}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">{formatCurrency(sku.revenue)}</p>
                  <p>{t("netLabel")}: {formatCurrency(sku.net)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("noTopSkus")}</p>
      )}
    </div>
  );
}
