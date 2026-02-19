"use client";

import { useTranslations } from "next-intl";
import { ShieldAlert, TrendingUp, GitCompare, Zap } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import type { CalcResult } from "@/lib/calculator/engine";

type BreakEven = { minPrice: number; maxCOGS: number; maxReturn: number; safe: boolean };
type SensRow   = { labelKey: string; hintKey: string; icon: string; gain: number; pct: number };
type Scenario  = { color: string; noteKey: string; r: CalcResult };
type Monte     = { p10: number; p50: number; p90: number; lossPct: number; riskKey: string; riskColor: string };

interface Props {
  breakEven: BreakEven;
  sensitivity: SensRow[];
  scenarios: Scenario[];
  monte: Monte;
  activePrice: number;
  productCost: number;
  returnRate: number;
}

const RISK_BG: Record<string, string>   = { green: "bg-green-100",  yellow: "bg-yellow-100", amber: "bg-amber-100",  red: "bg-red-100"  };
const RISK_TEXT: Record<string, string> = { green: "text-green-700", yellow: "text-yellow-700", amber: "text-amber-700", red: "text-red-700" };
const LOSS_BAR: Record<string, string>  = { green: "bg-green-500",  yellow: "bg-yellow-400", amber: "bg-amber-500", red: "bg-red-500" };

export function AnalysisSection({ breakEven, sensitivity, scenarios, monte, activePrice, productCost, returnRate }: Props) {
  const t = useTranslations("calculator.analysis");

  return (
    <div className="border-t border-border pt-2 space-y-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{t("sectionTitle")}</p>

      {/* 1. Break-even */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">{t("breakeven.title")}</h3>
          <span className={cn("ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
            breakEven.safe ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          )}>
            {breakEven.safe ? t("breakeven.safe") : t("breakeven.unsafe")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              icon: "💸", label: t("breakeven.minPrice"), value: formatCurrency(breakEven.minPrice),
              warn: activePrice <= breakEven.minPrice,
              sub: activePrice > breakEven.minPrice
                ? t("breakeven.aboveMin", { cur: formatCurrency(activePrice), diff: formatCurrency(activePrice - breakEven.minPrice) })
                : t("breakeven.belowMin"),
            },
            {
              icon: "🏭", label: t("breakeven.maxCOGS"), value: formatCurrency(breakEven.maxCOGS),
              warn: productCost >= breakEven.maxCOGS,
              sub: productCost < breakEven.maxCOGS
                ? t("breakeven.belowMax", { cur: formatCurrency(productCost), diff: formatCurrency(breakEven.maxCOGS - productCost) })
                : t("breakeven.aboveMax"),
            },
            {
              icon: "🔄", label: t("breakeven.maxReturn"), value: `${breakEven.maxReturn.toFixed(1)}%`,
              warn: returnRate >= breakEven.maxReturn,
              sub: returnRate < breakEven.maxReturn
                ? t("breakeven.belowReturnMax", { cur: returnRate, diff: (breakEven.maxReturn - returnRate).toFixed(1) })
                : t("breakeven.aboveReturnMax"),
            },
          ].map(({ icon, label, value, warn, sub }) => (
            <div key={label} className={cn("rounded-lg p-3 text-center border",
              warn ? "border-red-200 bg-red-50" : "border-border bg-muted/30"
            )}>
              <p className="text-lg mb-0.5">{icon}</p>
              <p className="text-xs text-muted-foreground leading-tight">{label}</p>
              <p className={cn("text-base font-bold mt-1", warn ? "text-red-600" : "text-foreground")}>{value}</p>
              <p className={cn("text-[10px] mt-1 leading-tight", warn ? "text-red-500" : "text-muted-foreground")}>{sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Sensitivity */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">{t("sensitivity.title")}</h3>
          <span className="text-xs text-muted-foreground ml-1">{t("sensitivity.subtitle")}</span>
        </div>
        <div className="space-y-2.5">
          {sensitivity.map((row, i) => (
            <div key={row.labelKey}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <span>{row.icon}</span>
                  <span>{t(`sensitivity.${row.labelKey}`)}</span>
                  {i === 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
                      {t("sensitivity.doFirst")}
                    </span>
                  )}
                </span>
                <span className={cn("font-semibold tabular-nums", row.gain > 0 ? "text-green-600" : "text-red-500")}>
                  {row.gain > 0 ? "+" : ""}{formatCurrency(row.gain)}/ชิ้น
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-3 rounded-full transition-all duration-500", row.gain > 0 ? "bg-green-500" : "bg-red-400")}
                    style={{ width: `${Math.abs(row.pct)}%` }} />
                </div>
                <span className="text-[10px] text-muted-foreground w-24 shrink-0">{t(`sensitivity.${row.hintKey}`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Scenario Lab */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <GitCompare className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">{t("scenario.title")}</h3>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {scenarios.map(({ color, noteKey, r }, i) => {
            const labelKey = i === 0 ? "worst" : i === 1 ? "expected" : "best";
            return (
              <div key={color} className={cn("rounded-lg p-3 border text-center",
                color === "red" ? "border-red-200 bg-red-50" : color === "green" ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"
              )}>
                <p className="text-sm font-semibold text-foreground">{t(`scenario.${labelKey}`)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{t(`scenario.${noteKey}`)}</p>
                <p className={cn("text-xl font-bold mt-2 tabular-nums",
                  r.profitPerUnit >= 0 ? (color === "green" ? "text-green-700" : "text-foreground") : "text-red-600"
                )}>
                  {formatCurrency(r.profitPerUnit)}
                </p>
                <p className="text-xs text-muted-foreground">{t("scenario.profitPerUnit")}</p>
                <div className={cn("mt-2 text-xs font-medium rounded px-1.5 py-0.5 inline-block",
                  r.profitMargin >= 15 ? "bg-green-100 text-green-700" :
                  r.profitMargin >= 0  ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                )}>
                  Margin {r.profitMargin.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center">{t("scenario.footnote")}</p>
      </div>

      {/* 4. Monte Carlo */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground">{t("monte.title")}</h3>
          <span className="text-xs text-muted-foreground ml-1">{t("monte.subtitle")}</span>
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className={cn("rounded-xl px-4 py-2 text-center min-w-[90px]", RISK_BG[monte.riskColor])}>
            <p className="text-xs text-muted-foreground">{t("monte.riskLabel")}</p>
            <p className={cn("text-lg font-bold", RISK_TEXT[monte.riskColor])}>{t(`monte.${monte.riskKey}`)}</p>
          </div>
          <div className="flex-1">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>{t("monte.lossChance")}</span>
              <span className="font-medium">{monte.lossPct.toFixed(0)}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
              <div className={cn("h-3 rounded-full transition-all duration-300", LOSS_BAR[monte.riskColor])}
                style={{ width: `${Math.min(monte.lossPct, 100)}%` }} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">{t("monte.note")}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {([
            { key: "p10", value: monte.p10, icon: "📉", cls: "text-red-600" },
            { key: "p50", value: monte.p50, icon: "📊", cls: "text-foreground" },
            { key: "p90", value: monte.p90, icon: "📈", cls: "text-green-600" },
          ] as { key: string; value: number; icon: string; cls: string }[]).map(({ key, value, icon, cls }) => (
            <div key={key} className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-base">{icon}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t(`monte.${key}`)}</p>
              <p className={cn("text-base font-bold tabular-nums mt-1", cls)}>{formatCurrency(value)}</p>
              <p className="text-[10px] text-muted-foreground">{t("monte.profitPerUnit")}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
