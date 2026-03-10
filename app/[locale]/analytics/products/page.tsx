"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { ArrowLeft, ArrowUpDown, BarChart3, ArrowRight, TrendingUp, Package, Hash, Star, AlertTriangle, TrendingDown, Layers, ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAnalyticsProductMetrics } from "@/lib/hooks/use-api";
import { usePermissions } from "@/contexts/AuthContext";
import { UrlDateRangePicker } from "@/components/shared/GlobalDateRangePicker";
import { useSearchParams } from "next/navigation";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

type SortKey = "revenue" | "qty" | "profit" | "margin";

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];
const MEDAL_LABELS = ["🥇", "🥈", "🥉"];

function formatCurrency(v: number) {
  return `฿${v.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function formatYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function truncateName(name: string, limit = 24) {
  if (!name) return "";
  return name.length > limit ? `${name.slice(0, limit)}…` : name;
}

function MarginBadge({ margin }: { margin: number | null }) {
  if (margin === null)
    return (
      <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted whitespace-nowrap">
        ไม่มีต้นทุน
      </span>
    );
  if (margin < 0)
    return (
      <span className="text-xs text-red-700 px-2 py-0.5 rounded-full bg-red-50 tabular-nums whitespace-nowrap">
        {margin.toFixed(1)}%
      </span>
    );
  if (margin < 15)
    return (
      <span className="text-xs text-amber-700 px-2 py-0.5 rounded-full bg-amber-50 tabular-nums whitespace-nowrap">
        {margin.toFixed(1)}%
      </span>
    );
  return (
    <span className="text-xs text-emerald-700 px-2 py-0.5 rounded-full bg-emerald-50 tabular-nums whitespace-nowrap">
      {margin.toFixed(1)}%
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank < 3) return <span className="text-base leading-none">{MEDAL_LABELS[rank]}</span>;
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-[11px] font-semibold text-muted-foreground tabular-nums">
      {rank + 1}
    </span>
  );
}

function EmptyState() {
  const t = useTranslations("analytics");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">ยังไม่มีข้อมูล</p>
        <p className="text-xs text-muted-foreground mt-1">นำเข้าข้อมูลจาก TikTok Shop เพื่อดูผลงานสินค้า</p>
      </div>
      <Link
        href="/import"
        className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 active:scale-95 px-4 py-2 rounded-lg transition-all"
      >
        {t("goImport")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

type TierKey = "stars" | "watch" | "losing" | "longTail";

function ProductsContent() {
  const t = useTranslations("analytics");
  const searchParams = useSearchParams();
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [defaultCost, setDefaultCost] = useState<number>(0);
  const [expandedTier, setExpandedTier] = useState<TierKey | null>(null);

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); })();
  const startDate = searchParams.get("startDate") ?? defaultStart;
  const endDate = searchParams.get("endDate") ?? todayStr;

  const metricsQuery = useAnalyticsProductMetrics({ from: startDate, to: endDate });

  const products = (metricsQuery.data?.products ?? []).map((p) => {
    const cost = defaultCost > 0 ? defaultCost * p.quantity : 0;
    const profitAdj = (p.profit ?? 0) - cost;
    const marginAdj = defaultCost > 0 && p.revenue > 0 ? (profitAdj / p.revenue) * 100 : null;
    const id = p.skuId || p.name || "unknown";
    return {
      id,
      name: p.name ?? p.skuId,
      shortName: truncateName(p.name ?? p.skuId, 20),
      qty: p.quantity ?? 0,
      revenue: p.revenue ?? 0,
      profit: profitAdj,
      margin: marginAdj,
      hasCost: defaultCost > 0,
    };
  });

  const hasData = metricsQuery.data?.hasData && products.length > 0;
  const isLoading = metricsQuery.isLoading;
  const isError = metricsQuery.isError;

  const sorted = useMemo(() => {
    return [...products].sort((a, b) => {
      const av =
        sortKey === "qty" ? a.qty
        : sortKey === "profit" ? (a.profit ?? -Infinity)
        : sortKey === "margin" ? (a.margin ?? -Infinity)
        : a.revenue;
      const bv =
        sortKey === "qty" ? b.qty
        : sortKey === "profit" ? (b.profit ?? -Infinity)
        : sortKey === "margin" ? (b.margin ?? -Infinity)
        : b.revenue;
      return sortDir === "desc" ? bv - av : av - bv;
    });
  }, [products, sortKey, sortDir]);

  const totalRevenue = useMemo(() => products.reduce((s, p) => s + p.revenue, 0), [products]);
  const totalProfit = useMemo(() => products.reduce((s, p) => s + (p.profit ?? 0), 0), [products]);
  const totalQty = useMemo(() => products.reduce((s, p) => s + p.qty, 0), [products]);
  const topProduct = sorted[0];
  const { can } = usePermissions();
  const canViewInventory = can("inventory:read");

  // Overall margin (when cost known)
  const overallMargin = useMemo(() => {
    const withCost = products.filter((p) => p.hasCost && p.revenue > 0);
    if (withCost.length === 0) return null;
    return (withCost.reduce((s, p) => s + (p.margin ?? 0), 0) / withCost.length);
  }, [products]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  // Products sorted by revenue — used by both charts
  const byRevenue = useMemo(() => [...products].sort((a, b) => b.revenue - a.revenue), [products]);

  // Pie chart: top 7 by revenue + bucket the rest as "อื่นๆ"
  const pieData = useMemo(() => {
    if (byRevenue.length <= 8) return byRevenue.map((p) => ({ name: p.shortName, revenue: p.revenue }));
    const top = byRevenue.slice(0, 7);
    const others = byRevenue.slice(7).reduce((s, p) => s + p.revenue, 0);
    return [
      ...top.map((p) => ({ name: p.shortName, revenue: p.revenue })),
      { name: "อื่นๆ", revenue: others },
    ];
  }, [byRevenue]);

  // Bar chart: ALL products by revenue (revenue-sorted, independent of table sort)
  const barData = useMemo(() => byRevenue, [byRevenue]);

  // Profit label for bar chart: distinguish net vs cost-adjusted
  const profitBarLabel = defaultCost > 0 ? `กำไร (หักต้นทุน ฿${defaultCost}/ชิ้น)` : "กำไรสุทธิ (net)";

  // Portfolio insights — computed from all products
  const portfolioInsights = useMemo(() => {
    const n = products.length;
    if (n === 0) return null;

    const top3Rev = byRevenue.slice(0, 3).reduce((s, p) => s + p.revenue, 0);
    const top3Pct = totalRevenue > 0 ? (top3Rev / totalRevenue) * 100 : 0;
    const topSharePct = totalRevenue > 0 ? ((byRevenue[0]?.revenue ?? 0) / totalRevenue) * 100 : 0;

    const withCost = products.filter((p) => p.hasCost);
    const noCost = products.filter((p) => !p.hasCost);
    const profitable = withCost.filter((p) => (p.profit ?? 0) > 0);
    const losing = withCost.filter((p) => (p.profit ?? 0) < 0);
    const avgMargin =
      withCost.length > 0 ? withCost.reduce((s, p) => s + (p.margin ?? 0), 0) / withCost.length : null;

    return { n, top3Pct, topSharePct, profitable: profitable.length, losing: losing.length, noCost: noCost.length, avgMargin };
  }, [products, byRevenue, totalRevenue]);

  // Product tiers — always computed from revenue; Watch/Losing only appear when cost data is available
  const productTiers = useMemo(() => {
    if (products.length < 2) return null;
    const medianRevenue = (() => {
      const revs = [...products].map((p) => p.revenue).sort((a, b) => a - b);
      const mid = Math.floor(revs.length / 2);
      return revs.length % 2 === 0 ? ((revs[mid - 1] + revs[mid]) / 2) : (revs[mid] ?? 0);
    })();
    const hasCostData = products.some((p) => p.hasCost);
    // Stars: revenue >= median AND (no cost OR margin >= 15%)
    const stars = products.filter((p) => p.revenue >= medianRevenue && (p.margin === null || (p.margin ?? 0) >= 15));
    // Watch: revenue >= median AND cost known AND margin 0–15%
    const watch = hasCostData ? products.filter((p) => p.revenue >= medianRevenue && p.margin !== null && (p.margin ?? 0) > 0 && (p.margin ?? 0) < 15) : [];
    // Losing: cost known AND margin < 0
    const losing = hasCostData ? products.filter((p) => p.hasCost && (p.margin ?? 0) < 0) : [];
    // Long tail: revenue < median (and not losing)
    const longTail = products.filter((p) => p.revenue < medianRevenue && (!p.hasCost || (p.margin ?? 0) >= 0));
    return { stars, watch, losing, longTail, medianRevenue };
  }, [products]);

  // Map product id → tier for inline row indicators
  const tierByProductId = useMemo(() => {
    const m = new Map<string, TierKey>();
    if (!productTiers) return m;
    productTiers.stars.forEach((p) => m.set(p.id, "stars"));
    productTiers.watch.forEach((p) => m.set(p.id, "watch"));
    productTiers.losing.forEach((p) => m.set(p.id, "losing"));
    productTiers.longTail.forEach((p) => m.set(p.id, "longTail"));
    return m;
  }, [productTiers]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1.5">
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> ศูนย์วิเคราะห์
        </Link>
        <h2 className="text-xl font-bold text-foreground">{t("products.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("products.description")}</p>
      </div>

      {/* Date range picker */}
      <UrlDateRangePicker />

      {/* Cost input */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="font-medium text-foreground whitespace-nowrap">ต้นทุน/ชิ้น (฿)</span>
          <input
            type="number"
            min={0}
            step="0.01"
            className="input-base w-28! h-8 text-xs"
            placeholder="0.00"
            value={defaultCost || ""}
            onChange={(e) => setDefaultCost(parseFloat(e.target.value) || 0)}
          />
        </label>
        {defaultCost > 0 ? (
          <span className="text-xs text-primary font-medium">ใช้คำนวณกำไรโดยประมาณ (ไม่บันทึก)</span>
        ) : (
          <span className="text-xs text-muted-foreground">ใส่เพื่อประมาณกำไรและ margin</span>
        )}
      </div>

      {/* Empty / error / loading state */}
      {isLoading && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-3 animate-pulse">
          <div className="h-4 w-40 bg-muted rounded" />
          <div className="h-3 w-64 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
        </div>
      )}
      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>โหลดข้อมูลไม่สำเร็จ</span>
          <button onClick={() => metricsQuery.refetch()} className="underline font-medium ml-3 hover:text-destructive/80">
            ลองอีกครั้ง
          </button>
        </div>
      )}
      {!isLoading && !isError && !hasData && (
        <div className="space-y-2">
          <EmptyState />
          <div className="text-center text-xs text-muted-foreground">
            ไม่มีข้อมูลในช่วง {startDate} — {endDate} · ลองเปลี่ยนช่วงวันที่ด้านบน
          </div>
        </div>
      )}

      {/* ─── Content ─── */}
      {hasData && !isLoading && !isError && (
        <>
          {/* Summary cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Revenue */}
            <div className="card p-4 space-y-1.5 border-l-[3px] border-l-blue-400">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">รายได้รวม</p>
                <div className="rounded-md bg-blue-50 p-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{formatCurrency(totalRevenue)}</p>
              <p className="text-[11px] text-muted-foreground">{startDate} — {endDate}</p>
            </div>
            {/* Profit */}
            <div className={cn("card p-4 space-y-1.5 border-l-[3px]", defaultCost > 0 ? (totalProfit < 0 ? "border-l-red-400" : "border-l-emerald-400") : "border-l-muted-foreground/20")}>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">กำไรรวม</p>
                <div className={cn("rounded-md p-1.5", defaultCost > 0 ? (totalProfit < 0 ? "bg-red-50" : "bg-emerald-50") : "bg-muted/60")}>
                  <TrendingUp className={cn("h-3.5 w-3.5", defaultCost > 0 ? (totalProfit < 0 ? "text-red-500" : "text-emerald-500") : "text-muted-foreground/40")} />
                </div>
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", defaultCost > 0 ? (totalProfit < 0 ? "text-red-600" : "text-emerald-600") : "text-muted-foreground/50")}>
                {defaultCost > 0 ? formatCurrency(totalProfit) : "—"}
              </p>
              {defaultCost > 0 ? (
                <p className="text-[11px] text-muted-foreground">หักต้นทุน ฿{defaultCost}/ชิ้น</p>
              ) : (
                <p className="text-[11px] text-amber-600/80">ตั้งต้นทุนเพื่อดูกำไร</p>
              )}
            </div>
            {/* Quantity */}
            <div className="card p-4 space-y-1.5 border-l-[3px] border-l-violet-400">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground font-medium">จำนวนขาย</p>
                <div className="rounded-md bg-violet-50 p-1.5">
                  <Hash className="h-3.5 w-3.5 text-violet-500" />
                </div>
              </div>
              <p className="text-2xl font-bold tabular-nums text-foreground">{totalQty.toLocaleString()}</p>
              <p className="text-[11px] text-muted-foreground">รวม {products.length} SKU</p>
            </div>
            {/* Margin or Top product */}
            {overallMargin !== null ? (
              <div className={cn("card p-4 space-y-1.5 border-l-[3px]", overallMargin < 0 ? "border-l-red-400" : overallMargin < 15 ? "border-l-amber-400" : "border-l-emerald-400")}>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">Avg Margin</p>
                  <div className={cn("rounded-md p-1.5", overallMargin < 0 ? "bg-red-50" : overallMargin < 15 ? "bg-amber-50" : "bg-emerald-50")}>
                    <TrendingUp className={cn("h-3.5 w-3.5", overallMargin < 0 ? "text-red-500" : overallMargin < 15 ? "text-amber-500" : "text-emerald-500")} />
                  </div>
                </div>
                <p className={cn("text-2xl font-bold tabular-nums", overallMargin < 0 ? "text-red-600" : overallMargin < 15 ? "text-amber-600" : "text-emerald-600")}>
                  {overallMargin.toFixed(1)}%
                </p>
                <p className={cn("text-[11px]", overallMargin < 0 ? "text-red-500/80" : overallMargin < 15 ? "text-amber-500/80" : "text-emerald-500/80")}>
                  {overallMargin < 0 ? "margin ติดลบ — ควรตรวจสอบ" : overallMargin < 15 ? "margin ต่ำ — พิจารณาปรับราคา" : "margin อยู่ในเกณฑ์ดี"}
                </p>
              </div>
            ) : (
              <div className="card p-4 space-y-1.5 border-l-[3px] border-l-amber-400">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">สินค้าขายดีสุด</p>
                  <div className="rounded-md bg-amber-50 p-1.5">
                    <Package className="h-3.5 w-3.5 text-amber-500" />
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground truncate leading-snug mt-1">{topProduct?.name ?? "—"}</p>
                <p className="text-[11px] text-muted-foreground">{topProduct ? formatCurrency(topProduct.revenue) : "—"}</p>
              </div>
            )}
          </div>

          {/* Portfolio Insights — concentration risk banner */}
          {portfolioInsights && (
            <div className={cn(
              "rounded-xl border px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-2",
              portfolioInsights.top3Pct >= 80
                ? "bg-amber-50 border-amber-200"
                : portfolioInsights.top3Pct >= 60
                ? "bg-blue-50 border-blue-200"
                : "bg-emerald-50 border-emerald-200"
            )}>
              <div className="flex items-center gap-2 min-w-0">
                <Layers className={cn("h-4 w-4 shrink-0", portfolioInsights.top3Pct >= 80 ? "text-amber-500" : portfolioInsights.top3Pct >= 60 ? "text-blue-500" : "text-emerald-500")} />
                <span className={cn("text-xs font-semibold", portfolioInsights.top3Pct >= 80 ? "text-amber-700" : portfolioInsights.top3Pct >= 60 ? "text-blue-700" : "text-emerald-700")}>
                  {portfolioInsights.top3Pct >= 80 ? "⚠️ Concentration Risk สูง" : portfolioInsights.top3Pct >= 60 ? "Revenue กระจายปานกลาง" : "Revenue กระจายดี"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px]">
                <span className="text-muted-foreground">
                  top 3 ครอง <span className="font-semibold text-foreground">{portfolioInsights.top3Pct.toFixed(0)}%</span>
                </span>
                <span className="text-muted-foreground">
                  อันดับ 1 ครอง <span className="font-semibold text-foreground">{portfolioInsights.topSharePct.toFixed(0)}%</span>
                  {" "}·{" "}
                  <span className="truncate" title={byRevenue[0]?.name}>{truncateName(byRevenue[0]?.name ?? "—", 20)}</span>
                </span>
                {portfolioInsights.noCost < portfolioInsights.n && (
                  <span className={cn("font-medium", portfolioInsights.losing > 0 ? "text-red-600" : "text-emerald-600")}>
                    {portfolioInsights.losing > 0
                      ? `${portfolioInsights.losing} SKU ขาดทุน`
                      : `${portfolioInsights.profitable} SKU ทำกำไร`}
                  </span>
                )}
                {portfolioInsights.noCost === portfolioInsights.n && (
                  <span className="text-amber-600 font-medium">ยังไม่ได้ตั้งต้นทุน — ใส่ต้นทุน/ชิ้นด้านบน</span>
                )}
              </div>
            </div>
          )}

          {/* Product Tier Analysis */}
          {productTiers && (productTiers.stars.length > 0 || productTiers.watch.length > 0 || productTiers.losing.length > 0) && (() => {
            const tierDefs = [
              { key: "stars"    as TierKey, items: productTiers.stars,    icon: <Star className="h-4 w-4" />,          label: "Stars",    desc: "revenue สูง · margin ≥ 15%",   color: "emerald" as const },
              { key: "watch"    as TierKey, items: productTiers.watch,    icon: <AlertTriangle className="h-4 w-4" />, label: "ควรดูแล", desc: "revenue สูง · margin 0–15%",    color: "amber"   as const },
              { key: "losing"   as TierKey, items: productTiers.losing,   icon: <TrendingDown className="h-4 w-4" />,  label: "ขาดทุน",  desc: "margin ติดลบ",                  color: "red"     as const },
              { key: "longTail" as TierKey, items: productTiers.longTail, icon: <Layers className="h-4 w-4" />,        label: "Long Tail",desc: "revenue ต่ำกว่า median",         color: "slate"   as const },
            ].filter(({ items }) => items.length > 0);
            const visibleCount = tierDefs.length;
            const gridCols =
              visibleCount === 1 ? "grid-cols-1" :
              visibleCount === 2 ? "grid-cols-2" :
              visibleCount === 3 ? "grid-cols-1 sm:grid-cols-3" :
                                   "grid-cols-2 lg:grid-cols-4";

            return (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Star className="h-4 w-4 text-amber-500" />
                <h3 className="text-sm font-semibold text-foreground">จัดกลุ่มสินค้า</h3>
                <span className="text-xs text-muted-foreground">จาก {products.length} SKU · median {formatCurrency(productTiers.medianRevenue)}</span>
              </div>

              {/* Tier cards — cols adjust to visible tier count */}
              <div className={cn("grid gap-px bg-border", gridCols)}>
                {tierDefs.map(({ key, items, icon, label, desc, color }) => {
                  const isOpen = expandedTier === key;
                  const cm = {
                    emerald: {
                      card:    isOpen ? "bg-emerald-100/80" : "bg-emerald-50 hover:bg-emerald-100/60",
                      strip:   "bg-emerald-400",
                      text:    "text-emerald-800",
                      sub:     "text-emerald-700/70",
                      badge:   "bg-emerald-200/80 text-emerald-800",
                      count:   "text-emerald-600",
                      row:     "text-emerald-700",
                      chevron: "text-emerald-500",
                    },
                    amber: {
                      card:    isOpen ? "bg-amber-100/80" : "bg-amber-50 hover:bg-amber-100/60",
                      strip:   "bg-amber-400",
                      text:    "text-amber-800",
                      sub:     "text-amber-700/70",
                      badge:   "bg-amber-200/80 text-amber-800",
                      count:   "text-amber-600",
                      row:     "text-amber-700",
                      chevron: "text-amber-500",
                    },
                    red: {
                      card:    isOpen ? "bg-red-100/80" : "bg-red-50 hover:bg-red-100/60",
                      strip:   "bg-red-400",
                      text:    "text-red-800",
                      sub:     "text-red-700/70",
                      badge:   "bg-red-200/80 text-red-800",
                      count:   "text-red-600",
                      row:     "text-red-700",
                      chevron: "text-red-500",
                    },
                    slate: {
                      card:    isOpen ? "bg-slate-100/80" : "bg-muted/30 hover:bg-muted/50",
                      strip:   "bg-slate-400",
                      text:    "text-foreground",
                      sub:     "text-muted-foreground",
                      badge:   "bg-slate-200/80 text-slate-700",
                      count:   "text-muted-foreground",
                      row:     "text-foreground",
                      chevron: "text-muted-foreground",
                    },
                  }[color];

                  // pad preview list to always show 3 rows for equal card height
                  const preview = items.slice(0, 3);
                  const padCount = Math.max(0, 3 - preview.length);

                  return (
                    <button
                      key={key}
                      onClick={() => setExpandedTier(isOpen ? null : key)}
                      className={cn(
                        "w-full text-left flex flex-col transition-colors duration-150",
                        cm.card
                      )}
                    >
                      {/* Top accent strip */}
                      <div className={cn("h-1 w-full", cm.strip)} />

                      <div className="flex flex-col flex-1 p-4 gap-3">
                        {/* Header row */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className={cn(cm.text)}>{icon}</span>
                              <span className={cn("text-sm font-bold", cm.text)}>{label}</span>
                            </div>
                            <p className={cn("text-[11px] leading-snug", cm.sub)}>{desc}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className={cn("text-2xl font-bold tabular-nums leading-none", cm.count)}>
                              {items.length}
                            </span>
                            <span className={cn("text-[10px] font-medium", cm.sub)}>SKU</span>
                          </div>
                        </div>

                        {/* Product preview — always 3 rows */}
                        <ul className="space-y-1.5 flex-1">
                          {preview.map((p) => (
                            <li key={p.id} className="flex items-center justify-between gap-2 min-w-0">
                              <span className={cn("text-[11px] truncate", cm.row)}>{truncateName(p.name, 20)}</span>
                              <span className={cn("text-[11px] shrink-0 tabular-nums font-medium", cm.row)}>
                                {p.margin !== null ? `${p.margin.toFixed(0)}%` : "—"}
                              </span>
                            </li>
                          ))}
                          {Array.from({ length: padCount }).map((_, i) => (
                            <li key={`pad-${i}`} className="h-4" />
                          ))}
                        </ul>

                        {/* Footer: overflow count + chevron */}
                        <div className="flex items-center justify-between pt-1 border-t border-current/10">
                          <span className={cn("text-[11px] font-medium", cm.sub)}>
                            {items.length > 3 ? `+${items.length - 3} เพิ่มเติม` : `ทั้งหมด ${items.length} SKU`}
                          </span>
                          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-200 shrink-0", cm.chevron, isOpen && "rotate-180")} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Expanded detail panel */}
              {expandedTier && (() => {
                const tierMap: Record<TierKey, { items: typeof productTiers.stars; label: string; color: string }> = {
                  stars:    { items: productTiers.stars,    label: "Stars",      color: "emerald" },
                  watch:    { items: productTiers.watch,    label: "ควรดูแล",    color: "amber" },
                  losing:   { items: productTiers.losing,   label: "ขาดทุน",     color: "red" },
                  longTail: { items: productTiers.longTail, label: "Long Tail",  color: "slate" },
                };
                const { items, label, color } = tierMap[expandedTier];
                const colorMap = {
                  emerald: { header: "bg-emerald-50 border-emerald-200 text-emerald-700", row: "hover:bg-emerald-50/50", badge: "bg-emerald-100 text-emerald-700" },
                  amber:   { header: "bg-amber-50 border-amber-200 text-amber-700",       row: "hover:bg-amber-50/50",   badge: "bg-amber-100 text-amber-700" },
                  red:     { header: "bg-red-50 border-red-200 text-red-700",             row: "hover:bg-red-50/50",     badge: "bg-red-100 text-red-700" },
                  slate:   { header: "bg-muted/30 border-border text-muted-foreground",   row: "hover:bg-muted/20",      badge: "bg-muted text-muted-foreground" },
                }[color];
                const tierRevenue = items.reduce((s, p) => s + p.revenue, 0);
                const tierQty = items.reduce((s, p) => s + p.qty, 0);
                return (
                  <div className="border-t border-border">
                    <div className={cn("flex items-center justify-between px-4 py-2 border-b text-xs font-medium", colorMap.header)}>
                      <span>{label} — {items.length} SKU · รวม {formatCurrency(tierRevenue)} · {tierQty.toLocaleString()} ชิ้น</span>
                      <button onClick={() => setExpandedTier(null)} className="opacity-60 hover:opacity-100 transition-opacity text-xs underline underline-offset-2">ปิด</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[460px] text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/20">
                            <th className="px-4 py-2 text-left text-[11px] font-semibold text-muted-foreground w-8">#</th>
                            <th className="px-3 py-2 text-left text-[11px] font-semibold text-muted-foreground">สินค้า</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">จำนวน</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">ยอดขาย</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">กำไร</th>
                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-muted-foreground">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[...items].sort((a, b) => b.revenue - a.revenue).map((p, i) => (
                            <tr key={p.id} className={cn("border-b border-border last:border-b-0 transition-colors", colorMap.row)}>
                              <td className="px-4 py-2.5">
                                <span className="text-[11px] text-muted-foreground tabular-nums">{i + 1}</span>
                              </td>
                              <td className="px-3 py-2.5 max-w-[200px]">
                                <span className="text-xs text-foreground truncate block" title={p.name}>{p.name}</span>
                              </td>
                              <td className="px-3 py-2.5 text-right text-xs tabular-nums text-foreground">{p.qty.toLocaleString()}</td>
                              <td className="px-3 py-2.5 text-right text-xs tabular-nums font-medium text-foreground">{formatCurrency(p.revenue)}</td>
                              <td className="px-3 py-2.5 text-right text-xs tabular-nums">
                                {!p.hasCost ? (
                                  <span className="text-muted-foreground/50">—</span>
                                ) : p.profit < 0 ? (
                                  <span className="text-red-600">{formatCurrency(p.profit)}</span>
                                ) : (
                                  <span className="text-foreground">{formatCurrency(p.profit)}</span>
                                )}
                              </td>
                              <td className="px-3 py-2.5 text-right">
                                <MarginBadge margin={p.margin} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-border bg-muted/20">
                            <td colSpan={2} className="px-4 py-2 text-[11px] font-semibold text-muted-foreground">รวม</td>
                            <td className="px-3 py-2 text-right text-[11px] font-semibold tabular-nums text-foreground">{tierQty.toLocaleString()}</td>
                            <td className="px-3 py-2 text-right text-[11px] font-semibold tabular-nums text-foreground">{formatCurrency(tierRevenue)}</td>
                            <td className="px-3 py-2 text-right text-[11px] font-semibold tabular-nums">
                              {items.some((p) => p.hasCost) ? (
                                <span className={items.reduce((s, p) => s + p.profit, 0) < 0 ? "text-red-600" : "text-foreground"}>
                                  {formatCurrency(items.reduce((s, p) => s + p.profit, 0))}
                                </span>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2" />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}
            </div>
            );
          })()}

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Pie chart — revenue share */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">สัดส่วนยอดขายต่อสินค้า</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  สัดส่วน revenue ของแต่ละ SKU จากยอดรวม {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="revenue"
                      nameKey="name"
                      cx="45%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={85}
                      paddingAngle={2}
                      labelLine={false}
                    >
                      {pieData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid hsl(var(--border))" }}
                      formatter={(v: unknown, _n, entry) => [
                        formatCurrency(Number(v)),
                        (entry?.payload as { name?: string })?.name ?? "",
                      ]}
                    />
                    <Legend
                      iconSize={8}
                      iconType="circle"
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      wrapperStyle={{ fontSize: "11px", maxWidth: "38%", paddingLeft: "8px" }}
                      formatter={(v) => (
                        <span className="text-[11px] text-muted-foreground">{truncateName(String(v), 18)}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top products rank list */}
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">Top สินค้าขายดี</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  เรียงตามยอดขาย · ทั้งหมด {products.length} SKU
                </p>
              </div>
              <ul className="space-y-2.5">
                {byRevenue.slice(0, 8).map((p, i) => {
                  const tier = tierByProductId.get(p.id);
                  const barColor =
                    tier === "stars"    ? "from-emerald-500 to-emerald-400" :
                    tier === "watch"    ? "from-amber-500 to-amber-400" :
                    tier === "losing"   ? "from-red-500 to-red-400" :
                    i === 0             ? "from-blue-600 to-blue-500" :
                                          "from-blue-400 to-blue-300";
                  const tierDot =
                    tier === "stars"  ? "bg-emerald-400" :
                    tier === "watch"  ? "bg-amber-400" :
                    tier === "losing" ? "bg-red-400" :
                    tier === "longTail" ? "bg-slate-300" : "";
                  return (
                    <li key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <RankBadge rank={i} />
                          {tierDot && <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tierDot)} />}
                          <span className="truncate text-foreground font-medium" title={p.name}>{truncateName(p.name, 22)}</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="tabular-nums font-semibold text-foreground">{formatCurrency(p.revenue)}</span>
                          <MarginBadge margin={p.margin} />
                        </div>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full bg-linear-to-r transition-all", barColor)}
                          style={{ width: `${(p.revenue / (byRevenue[0]?.revenue || 1)) * 100}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {products.length > 8 && (
                <p className="text-[11px] text-muted-foreground mt-2 flex items-center gap-1">
                  <span>+{products.length - 8} SKU อื่น</span>
                  <span className="opacity-40">·</span>
                  <span>ดูทั้งหมดในตารางด้านล่าง</span>
                </p>
              )}
            </div>
          </div>

          {/* Bar chart — ALL products, full width */}
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-foreground">ยอดขาย vs กำไร — ทุก SKU</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  เรียงตามยอดขายสูงสุด · ทั้งหมด {barData.length} SKU
                  {barData.length > 20 && " · เลื่อนซ้าย-ขวาเพื่อดูทั้งหมด"}
                </p>
              </div>
            </div>
            <div className="overflow-x-auto -mx-4 px-4 md:-mx-4 md:px-4">
              <div
                style={{ minWidth: Math.max(480, barData.length * (barData.length > 30 ? 36 : barData.length > 15 ? 48 : 64)), height: 260 }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} barCategoryGap="24%">
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: barData.length > 20 ? 9 : 10 }}
                      tickFormatter={(v) => truncateName(String(v), barData.length > 20 ? 8 : 12)}
                      tickLine={false}
                      axisLine={false}
                      interval={0}
                      angle={barData.length > 5 ? -35 : 0}
                      textAnchor={barData.length > 5 ? "end" : "middle"}
                      height={barData.length > 5 ? 56 : 28}
                    />
                    <YAxis
                      tick={{ fontSize: 10 }}
                      tickFormatter={formatYAxis}
                      tickLine={false}
                      axisLine={false}
                      width={48}
                    />
                    <Tooltip
                      contentStyle={{ fontSize: "0.75rem", borderRadius: "0.5rem", border: "1px solid hsl(var(--border))" }}
                      formatter={(v: unknown, name: string) => [formatCurrency(Number(v)), name]}
                      labelFormatter={(label) => truncateName(String(label), 40)}
                    />
                    <Legend
                      iconSize={8}
                      wrapperStyle={{ fontSize: "11px" }}
                      formatter={(v) => <span className="text-[11px] text-muted-foreground">{v}</span>}
                    />
                    <Bar dataKey="revenue" name="ยอดขาย" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="profit" name={profitBarLabel} fill="#10b981" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Sort chips — mobile */}
          <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {(["revenue", "qty", "profit", "margin"] as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors min-h-[32px]",
                  sortKey === key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
                )}
              >
                {key === "revenue" ? t("products.sortRevenue")
                  : key === "qty" ? t("products.sortQty")
                  : key === "profit" ? t("products.sortProfit")
                  : "Margin"}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {productTiers && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 border-b border-border bg-muted/20 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">ตารางสินค้าทั้งหมด</span>
                {[
                  { color: "bg-emerald-400", label: "Stars" },
                  { color: "bg-amber-400",   label: "ควรดูแล" },
                  { color: "bg-red-400",     label: "ขาดทุน" },
                  { color: "bg-slate-300",   label: "Long Tail" },
                ].map(({ color, label }) => (
                  <span key={label} className="flex items-center gap-1">
                    <span className={cn("w-2 h-2 rounded-full", color)} />
                    {label}
                  </span>
                ))}
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground w-8">
                      #
                    </th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground">
                      {t("products.colName")}
                    </th>
                    {(["qty", "revenue", "profit", "margin"] as SortKey[]).map((key) => (
                      <th key={key} className="px-3 py-3 text-right text-xs font-semibold text-muted-foreground">
                        <button
                          onClick={() => toggleSort(key)}
                          className={cn(
                            "inline-flex items-center gap-1 hover:text-foreground transition-colors",
                            sortKey === key && "text-primary"
                          )}
                        >
                          {key === "qty" ? t("products.colQty")
                            : key === "revenue" ? t("products.colRevenue")
                            : key === "profit" ? t("products.colProfit")
                            : t("products.colMargin")}
                          <ArrowUpDown className={cn("h-3 w-3 shrink-0", sortKey === key ? "text-primary" : "text-muted-foreground/40")} />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-xs text-muted-foreground">
                        ยังไม่มีข้อมูลสินค้า
                      </td>
                    </tr>
                  ) : (
                    sorted.map((p, i) => {
                      const tier = tierByProductId.get(p.id);
                      const rowHover =
                        tier === "stars"    ? "hover:bg-emerald-50/60" :
                        tier === "watch"    ? "hover:bg-amber-50/60" :
                        tier === "losing"   ? "hover:bg-red-50/60" :
                        "hover:bg-muted/20";
                      const tierDotCls =
                        tier === "stars"    ? "bg-emerald-400" :
                        tier === "watch"    ? "bg-amber-400" :
                        tier === "losing"   ? "bg-red-400" :
                        tier === "longTail" ? "bg-slate-300" : "bg-transparent";
                      return (
                        <tr
                          key={`${p.id || "row"}-${i}`}
                          className={cn(
                            "border-b border-border transition-colors",
                            rowHover,
                            i === sorted.length - 1 && "border-b-0"
                          )}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <RankBadge rank={i} />
                              <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", tierDotCls)} />
                            </div>
                          </td>
                          <td className="px-3 py-3 max-w-[220px]">
                            <span className="text-sm text-foreground truncate block" title={p.name}>
                              {p.name}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-sm tabular-nums text-foreground">
                            {p.qty.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right text-sm tabular-nums font-medium text-foreground">
                            {formatCurrency(p.revenue)}
                          </td>
                          <td className="px-3 py-3 text-right text-sm tabular-nums">
                            {!p.hasCost ? (
                              <span className="text-xs text-muted-foreground/50">—</span>
                            ) : p.profit < 0 ? (
                              <span className="text-red-600 font-medium">{formatCurrency(p.profit)}</span>
                            ) : (
                              <span className="text-emerald-700 font-medium">{formatCurrency(p.profit)}</span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-right">
                            <MarginBadge margin={p.margin} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>{sorted.length} SKU</span>
              {defaultCost === 0 && (
                <span>
                  ตั้งต้นทุน/ชิ้นด้านบนเพื่อดูกำไรและ margin
                </span>
              )}
            </div>
          </div>

          {/* No-cost unlock callout */}
          {defaultCost === 0 && (
            <div className="rounded-xl border border-amber-200 bg-linear-to-r from-amber-50 to-orange-50 px-4 py-3.5 flex items-start gap-3">
              <div className="rounded-lg bg-amber-100 p-1.5 shrink-0 mt-0.5">
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </div>
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-amber-800">ปลดล็อกการวิเคราะห์กำไรและ Margin</p>
                {canViewInventory ? (
                  <p className="text-xs text-amber-700">
                    ตั้งต้นทุน/ชิ้นในช่องด้านบนเพื่อประมาณกำไร หรือ{" "}
                    <Link href="/inventory" className="underline underline-offset-2 font-semibold hover:text-amber-900">
                      จัดการ Inventory
                    </Link>{" "}
                    เพื่อตั้งต้นทุนแบบถาวรต่อ SKU — แล้วส่วน <strong>ควรดูแล / ขาดทุน</strong> จะคำนวณให้อัตโนมัติ
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    ใส่ต้นทุน/ชิ้น (฿) ในช่องด้านบน — ระบบจะคำนวณกำไร margin และจัดกลุ่มสินค้า <strong>ควรดูแล / ขาดทุน</strong> ให้อัตโนมัติ
                  </p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <RequirePermission permission="analytics:read">
      <ProductsContent />
    </RequirePermission>
  );
}
