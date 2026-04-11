"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { ArrowLeft, Activity, BarChart3, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { UrlDateRangePicker } from "@/components/shared/GlobalDateRangePicker";
import { InsightFirstWrapper } from "@/components/shared/InsightFirstWrapper";
import { AnalyticsLoadingSkeleton } from "@/components/shared/AnalyticsLoadingSkeleton";
import { useSearchParams } from "next/navigation";
import { useAnalyticsTrends } from "@/lib/hooks/use-api";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { cn } from "@/lib/utils";

function formatYAxis(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return String(v);
}

function formatCurrency(v: number) {
  return `฿${v.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function EmptyState() {
  const t = useTranslations("analytics");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <Activity className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t("revenue.emptyTitle")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("trends.title")} — {t("revenue.emptyDesc")}</p>
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

function GrowthBadge({ growth }: { growth: number }) {
  if (growth > 15) return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><TrendingUp className="h-3.5 w-3.5" />+{growth.toFixed(1)}%</span>;
  if (growth >= 0) return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600"><Minus className="h-3.5 w-3.5" />+{growth.toFixed(1)}%</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600"><TrendingDown className="h-3.5 w-3.5" />{growth.toFixed(1)}%</span>;
}

function TrendsContent() {
  const t = useTranslations("analytics");
  const searchParams = useSearchParams();
  const [period, setPeriod] = useState<"weekly" | "monthly">("monthly");

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 89); return d.toISOString().slice(0, 10); })();
  const startDate = searchParams.get("startDate") ?? defaultStart;
  const endDate = searchParams.get("endDate") ?? todayStr;

  const trendsQuery = useAnalyticsTrends({ from: startDate, to: endDate, period });
  const data = trendsQuery.data;
  const hasData = !!data?.hasData && (data.buckets?.length > 0 || data.monthlyBuckets?.length > 0 || data.momGrowth?.length > 0);
  const isLoading = trendsQuery.isLoading;
  const isError = trendsQuery.isError;

  const buckets = period === "weekly" ? (data?.buckets ?? []) : (data?.monthlyBuckets ?? data?.buckets ?? []);
  const momGrowth = data?.momGrowth ?? [];
  const lastMom = momGrowth.length > 0 ? momGrowth[momGrowth.length - 1] : null;
  const yoy = data?.yoy ?? [];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1.5">
        <Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("hubBack")}
        </Link>
        <h2 className="text-xl font-bold text-foreground">{t("trends.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("trends.description")}</p>
      </div>

      <UrlDateRangePicker />

      {/* Period toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setPeriod("weekly")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            period === "weekly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {t("trends.periodWeekly")}
        </button>
        <button
          type="button"
          onClick={() => setPeriod("monthly")}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
            period === "monthly" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {t("trends.periodMonthly")}
        </button>
      </div>

      {isLoading && <AnalyticsLoadingSkeleton kpiCount={4} showChart />}
      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{t("loadError")}</span>
          <button onClick={() => trendsQuery.refetch()} className="underline font-medium ml-3">{t("retry")}</button>
        </div>
      )}
      {!isLoading && !isError && !hasData && <EmptyState />}

      {hasData && data && (
        <>
          {lastMom && (
            <InsightFirstWrapper
              severity={lastMom.growth > 20 ? "success" : lastMom.growth >= 0 ? "info" : "warning"}
              message={
                lastMom.growth > 20
                  ? `${t("trends.growthMom")} +${lastMom.growth.toFixed(1)}% — ดีมาก`
                  : lastMom.growth >= 0
                  ? `MoM ล่าสุด ${lastMom.label}: +${lastMom.growth.toFixed(1)}%`
                  : `MoM ล่าสุด ${lastMom.label}: ${lastMom.growth.toFixed(1)}% — ควรติดตาม`
              }
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {lastMom && (
              <div className="card p-4 border border-border rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">{t("trends.momGrowth")}</p>
                <div className="mt-1"><GrowthBadge growth={lastMom.growth} /></div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{lastMom.label}</p>
              </div>
            )}
            {buckets.length > 0 && (() => {
              const best = [...buckets].sort((a, b) => b.revenue - a.revenue)[0];
              const worst = [...buckets].sort((a, b) => a.revenue - b.revenue)[0];
              return (
                <>
                  {best && (
                    <div className="card p-4 border border-border rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">{t("trends.bestMonth")}</p>
                      <p className="text-lg font-bold text-foreground mt-1">{best.label}</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(best.revenue)}</p>
                    </div>
                  )}
                  {worst && worst !== best && (
                    <div className="card p-4 border border-border rounded-xl">
                      <p className="text-xs text-muted-foreground font-medium">{t("trends.worstMonth")}</p>
                      <p className="text-lg font-bold text-foreground mt-1">{worst.label}</p>
                      <p className="text-[11px] text-muted-foreground">{formatCurrency(worst.revenue)}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {buckets.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("trends.revenueByPeriod")}</h3>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={buckets}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={48} />
                    <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), "Revenue"]} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {momGrowth.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("trends.growthMom")}</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={momGrowth} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                    <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, "Growth"]} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Bar dataKey="growth" name="Growth %" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {yoy.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("trends.yoyCompare")}</h3>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yoy} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={formatYAxis} width={48} />
                    <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), ""]} />
                    <Legend />
                    <Bar dataKey="currentYear" name={t("trends.currentYear")} fill="#3b82f6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="previousYear" name={t("trends.lastYear")} fill="#94a3b8" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function TrendsPage() {
  return (
    <RequirePermission permission="analytics:read">
      <Suspense>
        <TrendsContent />
      </Suspense>
    </RequirePermission>
  );
}
