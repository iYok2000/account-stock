"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { ArrowLeft, Wallet, BarChart3, ArrowRight } from "lucide-react";
import { UrlDateRangePicker } from "@/components/shared/GlobalDateRangePicker";
import { InsightFirstWrapper } from "@/components/shared/InsightFirstWrapper";
import { AnalyticsLoadingSkeleton } from "@/components/shared/AnalyticsLoadingSkeleton";
import { ChartNarrative } from "@/components/shared/ChartNarrative";
import { profitMarginNarrative } from "@/lib/chart-narratives";
import { useSearchParams } from "next/navigation";
import { useAnalyticsProfitability } from "@/lib/hooks/use-api";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { cn } from "@/lib/utils";

function formatCurrency(v: number) {
  return `฿${v.toLocaleString("th-TH", { minimumFractionDigits: 0 })}`;
}

function EmptyState() {
  const t = useTranslations("analytics");
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-2xl bg-muted/40 p-5">
        <Wallet className="h-10 w-10 text-muted-foreground/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{t("revenue.emptyTitle")}</p>
        <p className="text-xs text-muted-foreground mt-1">{t("profitability.title")} — {t("revenue.emptyDesc")}</p>
      </div>
      <Link href="/import" className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary/90 active:scale-95 px-4 py-2 rounded-lg transition-all">
        {t("goImport")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function ProfitabilityContent() {
  const t = useTranslations("analytics");
  const searchParams = useSearchParams();
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultStart = (() => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); })();
  const startDate = searchParams.get("startDate") ?? defaultStart;
  const endDate = searchParams.get("endDate") ?? todayStr;

  const profitQuery = useAnalyticsProfitability({ from: startDate, to: endDate });
  const data = profitQuery.data;
  const hasData = !!data?.hasData;
  const isLoading = profitQuery.isLoading;
  const isError = profitQuery.isError;

  // What-if calculator state (always visible)
  const [price, setPrice] = useState(1000);
  const [cost, setCost] = useState(600);
  const [feePct, setFeePct] = useState(15);
  const [discountPct, setDiscountPct] = useState(20);

  const whatIf = useMemo(() => {
    const sellingPrice = price * (1 - discountPct / 100);
    const fees = sellingPrice * (feePct / 100);
    const profit = sellingPrice - cost - fees;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
    const breakeven = profit > 0 ? cost / profit : null;
    return { sellingPrice, fees, profit, margin, breakeven };
  }, [price, cost, feePct, discountPct]);

  const marginSeverity = whatIf.margin < 10 ? "danger" : whatIf.margin < 20 ? "warning" : "success";
  const marginMessage =
    whatIf.margin < 10 ? t("profitability.marginLow", { pct: whatIf.margin.toFixed(1) })
    : whatIf.margin < 20 ? t("profitability.marginMid", { pct: whatIf.margin.toFixed(1) })
    : t("profitability.marginGood", { pct: whatIf.margin.toFixed(1) });

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-1.5">
        <Link href="/analytics" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> {t("hubBack")}
        </Link>
        <h2 className="text-xl font-bold text-foreground">{t("profitability.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("profitability.description")}</p>
      </div>

      <UrlDateRangePicker />

      {isLoading && !hasData && <AnalyticsLoadingSkeleton kpiCount={4} showChart />}
      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center justify-between">
          <span>{t("loadError")}</span>
          <button onClick={() => profitQuery.refetch()} className="underline font-medium ml-3">{t("retry")}</button>
        </div>
      )}
      {!isLoading && !isError && !hasData && <EmptyState />}

      {hasData && data && (
        <>
          {data.avgMargin != null && (
            <InsightFirstWrapper
              severity={data.avgMargin > 25 ? "success" : data.avgMargin >= 15 ? "info" : "warning"}
              message={`${t("profitability.avgMargin")}: ${data.avgMargin.toFixed(1)}% — ${data.avgMargin > 25 ? "ดีมาก" : data.avgMargin >= 15 ? "พอใช้" : "ควรปรับปรุง"}`}
            />
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.avgMargin != null && (
              <div className="card p-4 border border-border rounded-xl">
                <p className="text-xs text-muted-foreground font-medium">{t("profitability.avgMargin")}</p>
                <p className={cn(
                  "text-2xl font-bold tabular-nums mt-1",
                  data.avgMargin >= 25 ? "text-emerald-600" : data.avgMargin >= 15 ? "text-amber-600" : "text-red-600"
                )}>
                  {data.avgMargin.toFixed(1)}%
                </p>
              </div>
            )}
          </div>

          {data.marginBuckets && data.marginBuckets.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("profitability.marginDist")}</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.marginBuckets} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip />
                    <Bar dataKey="count" name="SKU" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ChartNarrative text={profitMarginNarrative(data.avgMargin)} />
            </div>
          )}

          {data.byCategory && data.byCategory.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("profitability.byCategory")}</h3>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                    <Tooltip formatter={(v: unknown) => [formatCurrency(Number(v)), t("profitability.profit")]} />
                    <Bar dataKey="profit" name={t("profitability.profit")} fill="#10b981" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {data.marginTrend && data.marginTrend.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-4">
              <h3 className="text-sm font-semibold text-foreground mb-4">{t("profitability.marginTrend")}</h3>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.marginTrend}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={40} />
                    <Tooltip formatter={(v: unknown) => [`${Number(v).toFixed(1)}%`, t("profitability.margin")]} />
                    <Line type="monotone" dataKey="margin" name={t("profitability.margin")} stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}

      {/* What-if Calculator — always shown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-1">{t("profitability.whatIfTitle")}</h3>
        <p className="text-xs text-muted-foreground mb-4">{t("profitability.whatIfDesc")}</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t("profitability.price")}</span>
            <input type="number" min={0} step={1} className="input-base w-full h-9 text-sm" value={price} onChange={(e) => setPrice(Number(e.target.value) || 0)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t("profitability.cost")}</span>
            <input type="number" min={0} step={1} className="input-base w-full h-9 text-sm" value={cost} onChange={(e) => setCost(Number(e.target.value) || 0)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t("profitability.feeRate")}</span>
            <input type="number" min={0} max={100} step={0.5} className="input-base w-full h-9 text-sm" value={feePct} onChange={(e) => setFeePct(Number(e.target.value) || 0)} />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium text-muted-foreground">{t("profitability.discountRate")}</span>
            <input type="number" min={0} max={100} step={1} className="input-base w-full h-9 text-sm" value={discountPct} onChange={(e) => setDiscountPct(Number(e.target.value) || 0)} />
          </label>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">{t("profitability.sellingAfterDiscount")}</span><span className="font-medium tabular-nums">{formatCurrency(whatIf.sellingPrice)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("profitability.fees")}</span><span className="font-medium tabular-nums">{formatCurrency(whatIf.fees)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("profitability.profit")}</span><span className={cn("font-semibold tabular-nums", whatIf.profit < 0 ? "text-red-600" : "text-foreground")}>{formatCurrency(whatIf.profit)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">{t("profitability.margin")}</span><span className={cn("font-semibold tabular-nums", marginSeverity === "danger" ? "text-red-600" : marginSeverity === "warning" ? "text-amber-600" : "text-emerald-600")}>{whatIf.margin.toFixed(1)}%</span></div>
          {whatIf.breakeven != null && whatIf.breakeven > 0 && (
            <div className="flex justify-between"><span className="text-muted-foreground">{t("profitability.breakeven")}</span><span className="font-medium tabular-nums">{whatIf.breakeven.toFixed(0)} units</span></div>
          )}
        </div>
        <InsightFirstWrapper severity={marginSeverity as "success" | "info" | "warning" | "danger"} message={marginMessage} className="mt-3" />
        <p className="mt-3 text-xs text-muted-foreground">
          <Link href="/calculator" className="underline hover:text-foreground">{t("profitability.goCalculator")}</Link>
        </p>
      </div>
    </div>
  );
}

export default function ProfitabilityPage() {
  return (
    <RequirePermission permission="analytics:read">
      <ProfitabilityContent />
    </RequirePermission>
  );
}
