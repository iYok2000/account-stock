"use client";

import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Minus,
  ArrowLeft,
  BarChart3,
  ArrowRight,
} from "lucide-react";

function formatYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAnalyticsReconciliation, useAnalyticsDailyMetrics } from "@/lib/hooks/use-api";
import { getFeeLabel, FEE_COLORS as FEE_COLOR_MAP, sortFeeBreakdown } from "@/lib/analytics/fee-types";
import { UrlDateRangePicker } from "@/components/shared/GlobalDateRangePicker";
import { useSearchParams } from "next/navigation";

// ─── Types ───────────────────────────────────────────────────
interface FeeItem {
  label: string;
  value: number;
}

interface ReconData {
  gmv: number;
  settlement: number;
  totalFees: number;
  netProfit: number;
  gmvChange?: number;
  settlementChange?: number;
  profitChange?: number;
  feeBreakdown: FeeItem[];
  settlementRate: number;
}

interface TimeSeriesItem {
  label: string;
  revenue: number;
  profit: number;
  settlement: number;
}

/** Fallback palette for fee keys not in FEE_COLOR_MAP */
const FEE_COLORS_FALLBACK = ["#6366f1", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"];
function feeColor(key: string, idx: number): string {
  return FEE_COLOR_MAP[key] ?? FEE_COLORS_FALLBACK[idx % FEE_COLORS_FALLBACK.length];
}

function formatCurrency(v: number) {
  return `฿${v.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

// ─── Empty State ─────────────────────────────────────────────
function EmptyChart({ height = "h-[220px]" }: { height?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 rounded-xl bg-muted/30 border border-dashed border-border", height)}>
      <BarChart3 className="h-8 w-8 text-muted-foreground/40" />
      <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูล</p>
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────
function KpiCard({
  icon: Icon,
  title,
  value,
  change,
  negative,
  empty,
}: {
  icon: React.ElementType;
  title: string;
  value: string | null;
  change?: number | null;
  negative?: boolean;
  empty?: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 min-w-[150px] snap-start shrink-0 lg:min-w-0">
      <div className="flex items-start justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          {empty || value === null ? (
            <p className="text-lg font-bold text-muted-foreground/40">—</p>
          ) : (
            <p className={cn("text-lg font-bold", negative ? "text-red-600" : "text-foreground")}>
              {value}
            </p>
          )}
          {!empty && change != null && (
            <div className="flex items-center gap-1">
              {change >= 0 ? (
                <TrendingUp className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500 shrink-0" />
              )}
              <span className={`text-xs ${change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                {change > 0 ? "+" : ""}{change.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
        <div className="rounded-lg bg-muted p-2 shrink-0">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

// ─── Empty Page State ─────────────────────────────────────────
function EmptyState() {
  const t = useTranslations("analytics");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <BarChart3 className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">ยังไม่มีข้อมูล</p>
        <p className="text-xs text-muted-foreground mt-1">นำเข้าข้อมูลจาก TikTok Shop เพื่อดูรายได้และค่าธรรมเนียม</p>
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

// ─── Fee Breakdown (empty) ────────────────────────────────────
function FeeBreakdownEmpty({ label }: { label: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">{label}</h3>
      <EmptyChart height="h-[200px]" />
    </div>
  );
}

// ─── Revenue Page ─────────────────────────────────────────────
function RevenueContent() {
  const t = useTranslations("analytics");
  const searchParams = useSearchParams();

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); })();
  const startDate = searchParams.get("startDate") ?? defaultStart;
  const endDate = searchParams.get("endDate") ?? todayStr;

  const reconQuery = useAnalyticsReconciliation({ from: startDate, to: endDate });
  const dailyQuery = useAnalyticsDailyMetrics({ from: startDate, to: endDate });

  const recon: ReconData | null = reconQuery.data
    ? {
        gmv: reconQuery.data.gmv,
        settlement: reconQuery.data.settlement,
        totalFees: reconQuery.data.totalFees,
        netProfit: reconQuery.data.netProfit,
        feeBreakdown:
          reconQuery.data.feeBreakdown?.map((f) => ({ label: f.label, value: f.value })) ?? [],
        settlementRate: reconQuery.data.settlementRate ?? 0,
      }
    : null;

  const timeSeries: TimeSeriesItem[] =
    dailyQuery.data?.timeSeries?.map((p) => ({
      label: p.label.slice(5), // MM-DD for brevity
      revenue: p.revenue,
      profit: p.profit,
      settlement: p.settlement,
    })) ?? [];

  const hasData = !!reconQuery.data?.hasData || !!dailyQuery.data?.hasData;

  const feeBreakdownSorted = recon ? sortFeeBreakdown(recon.feeBreakdown) : [];

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
        <h2 className="text-xl font-bold text-foreground">{t("revenue.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("revenue.description")}</p>
      </div>

      {/* Date range picker */}
      <UrlDateRangePicker />

      {/* No data — full empty state */}
      {!hasData && <EmptyState />}

      {/* ─── Content (แสดงเมื่อ hasData = true) ─── */}
      {hasData && recon && (
        <>
          {/* KPI Cards */}
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide lg:grid lg:grid-cols-4 lg:overflow-visible lg:pb-0">
            <KpiCard icon={DollarSign} title={t("revenue.gmv")} value={formatCurrency(recon.gmv)} change={recon.gmvChange} />
            <KpiCard icon={Wallet} title={t("revenue.settlement")} value={formatCurrency(recon.settlement)} change={recon.settlementChange} />
            <KpiCard icon={Minus} title={t("revenue.totalFees")} value={formatCurrency(recon.totalFees)} negative />
            <KpiCard icon={TrendingUp} title={t("revenue.netProfit")} value={formatCurrency(recon.netProfit)} change={recon.profitChange} />
          </div>

          {/* Revenue & Profit chart */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">{t("revenue.revenueChart")}</h3>
            {timeSeries.length === 0 ? (
              <EmptyChart height="h-[260px]" />
            ) : (
              <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                <div className="min-w-[360px] h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeries}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={48} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "0.5rem", fontSize: "0.8rem" }}
                        formatter={(val, name) => [formatCurrency(Number(val ?? 0)), name === "revenue" ? "รายได้" : "กำไร"]}
                      />
                      <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={2} />
                      <Area type="monotone" dataKey="profit" name="profit" stroke="#10b981" fill="#10b981" fillOpacity={0.15} strokeWidth={2} strokeDasharray="5 3" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Fee Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {feeBreakdownSorted.length === 0 ? (
              <>
                <FeeBreakdownEmpty label={t("revenue.feeDonut")} />
                <FeeBreakdownEmpty label={t("revenue.feeDetail")} />
              </>
            ) : (
              <>
                {/* Donut — สัดส่วนค่าธรรมเนียม */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-1">{t("revenue.feeDonut")}</h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    รวม {formatCurrency(feeBreakdownSorted.reduce((s, f) => s + f.value, 0))}
                  </p>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={feeBreakdownSorted}
                          dataKey="value"
                          nameKey="label"
                          cx="40%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={2}
                        >
                          {feeBreakdownSorted.map((fee, idx) => (
                            <Cell key={fee.label} fill={feeColor(fee.label, idx)} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ fontSize: "0.8rem", borderRadius: "0.5rem", border: "1px solid hsl(var(--border))" }}
                          formatter={(val, _n, entry) => [
                            formatCurrency(Number(val ?? 0)),
                            getFeeLabel((entry?.payload as { label?: string })?.label ?? ""),
                          ]}
                        />
                        <Legend
                          iconType="circle"
                          iconSize={8}
                          formatter={(v) => (
                            <span className="text-xs text-muted-foreground">{getFeeLabel(String(v))}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Progress list — รายละเอียดค่าธรรมเนียม */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">{t("revenue.feeDetail")}</h3>
                  <div className="space-y-3">
                    {feeBreakdownSorted.map((fee, idx) => {
                      const total = feeBreakdownSorted.reduce((s, f) => s + f.value, 0);
                      const pct = total > 0 ? (fee.value / total) * 100 : 0;
                      const color = feeColor(fee.label, idx);
                      return (
                        <div key={fee.label} className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-2 text-foreground text-xs">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: color }}
                              />
                              {getFeeLabel(fee.label)}
                            </span>
                            <span className="font-mono text-xs font-semibold text-foreground tabular-nums">
                              {formatCurrency(fee.value)}
                            </span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct}%`, backgroundColor: color }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">{pct.toFixed(1)}% ของค่าธรรมเนียมรวม</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Settlement timeline */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-1">{t("revenue.settlementTimeline")}</h3>
            <p className="text-xs text-muted-foreground mb-4">{t("revenue.settlementTimelineDesc")}</p>
            {timeSeries.length === 0 ? (
              <EmptyChart height="h-[220px]" />
            ) : (
              <>
                <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
                  <div className="min-w-[360px] h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={48} />
                        <Tooltip
                          contentStyle={{ fontSize: "0.8rem", borderRadius: "0.5rem" }}
                          formatter={(val, name) => [formatCurrency(Number(val ?? 0)), name === "revenue" ? "รายได้รวม" : "รับชำระจริง"]}
                        />
                        <Area type="monotone" dataKey="revenue" name="revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.07} strokeWidth={2} />
                        <Area type="monotone" dataKey="settlement" name="settlement" stroke="#10b981" fill="#10b981" fillOpacity={0.12} strokeWidth={2} strokeDasharray="5 3" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 rounded bg-blue-500" />
                    รายได้รวม
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-4 h-0.5 rounded border-dashed border-b-2 border-emerald-500" />
                    รับชำระจริง
                  </span>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function RevenuePage() {
  return (
    <RequirePermission permission="analytics:read">
      <RevenueContent />
    </RequirePermission>
  );
}
