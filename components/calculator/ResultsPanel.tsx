"use client";

import { useTranslations } from "next-intl";
import { formatCurrency, cn } from "@/lib/utils";
import { FEE, type CalcResult } from "@/lib/calculator/engine";

interface Props {
  result: CalcResult;
  activePrice: number;
  listPrice: number;
  productCost: number;
  packagingCost: number;
  shippingCost: number;
  affiliateRate: number;
  adSpend: number;
  quantity: number;
  returnRate: number;
  priceMode: "list" | "selling";
  goalProfit: number | null;
}

function Row({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="flex justify-between py-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm text-red-500 tabular-nums">-{formatCurrency(amount)}</span>
    </div>
  );
}

export function ResultsPanel(p: Props) {
  const t = useTranslations("calculator.results");
  const { result } = p;
  const marginColor = result.profitMargin >= 30 ? "text-green-600" : result.profitMargin >= 15 ? "text-amber-600" : "text-red-600";
  const marginBg    = result.profitMargin >= 30 ? "bg-green-500"  : result.profitMargin >= 15 ? "bg-amber-500"  : "bg-red-500";

  return (
    <div className="space-y-4">
      {/* Per-unit cost breakdown */}
      <div className="card space-y-2">
        <h3 className="font-semibold text-foreground">{t("title")}</h3>

        {p.listPrice !== p.activePrice && (
          <div className="flex justify-between py-1 text-sm">
            <span className="text-muted-foreground">{t("listPrice")}</span>
            <span className="text-muted-foreground line-through tabular-nums">{formatCurrency(p.listPrice)}</span>
          </div>
        )}
        <div className="flex justify-between py-2 border-b border-border text-sm">
          <span className="text-muted-foreground">{p.priceMode === "list" ? t("listPriceUsed") : t("sellingPriceUsed")}</span>
          <span className="font-medium tabular-nums">{formatCurrency(p.activePrice)}</span>
        </div>

        <p className="text-xs font-medium text-muted-foreground mt-1">{t("costs")}</p>
        <Row label={t("productCost")}  amount={p.productCost} />
        <Row label={t("packagingCost")} amount={p.packagingCost} />
        <Row label={t("shippingCost")} amount={p.shippingCost} />
        <Row label={`Commission (${(FEE.COMMISSION * 100).toFixed(1)}%)`}   amount={result.commissionPerUnit} />
        <Row label={`VAT (${(FEE.VAT * 100).toFixed(1)}%)`}                amount={result.commissionVatPerUnit} />
        <Row label={t("paymentFee", { r: (FEE.PAYMENT * 100).toFixed(1) })} amount={result.paymentFeePerUnit} />
        <Row label={`Affiliate (${p.affiliateRate}%)`}                      amount={result.affiliateFeePerUnit} />
        {p.adSpend > 0 && <Row label={t("adSpend")} amount={p.adSpend} />}

        <div className="flex justify-between py-2 border-t border-border font-medium">
          <span>{t("totalCost")}</span>
          <span className="text-red-500 tabular-nums">-{formatCurrency(result.totalCostPerUnit)}</span>
        </div>
        <div className="flex justify-between py-3 border-t-2 border-foreground/20">
          <span className="text-lg font-bold">{t("profitPerUnit")}</span>
          <span className={cn("text-lg font-bold tabular-nums", result.profitPerUnit >= 0 ? "text-green-600" : "text-red-600")}>
            {formatCurrency(result.profitPerUnit)}
          </span>
        </div>

        {p.goalProfit !== null && (
          <div className={cn("flex justify-between py-2 rounded px-3 text-sm",
            result.profitPerUnit >= p.goalProfit ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}>
            <span>{t("goal")}</span>
            <span className="font-medium tabular-nums">
              {formatCurrency(p.goalProfit)} ({result.profitPerUnit >= p.goalProfit
                ? t("goalMet")
                : t("goalShort", { amount: formatCurrency(p.goalProfit - result.profitPerUnit) })})
            </span>
          </div>
        )}

        <div className="space-y-1 pt-1">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Profit Margin</span>
            <span className={cn("font-medium tabular-nums", marginColor)}>{result.profitMargin.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
            <div className={cn("h-2.5 rounded-full transition-all duration-300", marginBg)}
              style={{ width: `${Math.max(0, Math.min(100, result.profitMargin))}%` }} />
          </div>
          <p className="text-xs text-muted-foreground">
            {result.profitMargin >= 30 ? t("marginGood") : result.profitMargin >= 15 ? t("marginMid") : t("marginLow")}
          </p>
        </div>
      </div>

      {/* Monthly / yearly projections */}
      <div className="card space-y-3">
        <h3 className="font-semibold text-foreground">{t("projection")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("projectionDesc", { qty: p.quantity.toLocaleString(), ret: p.returnRate, eff: result.effectiveUnits.toLocaleString() })}
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          {([
            { label: t("perUnit"),  value: result.profitPerUnit },
            { label: t("perMonth"), value: result.monthlyProfit },
            { label: t("perYear"),  value: result.yearlyProfit },
          ] as { label: string; value: number }[]).map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={cn("text-base font-bold tabular-nums", value >= 0 ? "text-green-600" : "text-red-600")}>
                {formatCurrency(value)}
              </p>
            </div>
          ))}
        </div>
        <div className="border-t pt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("netRevenueMonth")}</span>
            <span className="tabular-nums">{formatCurrency(result.monthlyRevenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t("totalCostMonth")}</span>
            <span className="tabular-nums text-red-500">-{formatCurrency(result.monthlyCost)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-2">
            <span>{t("netProfitMonth")}</span>
            <span className={cn("tabular-nums", result.monthlyProfit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(result.monthlyProfit)}
            </span>
          </div>
          <div className="flex justify-between font-medium">
            <span>{t("netProfitYear")}</span>
            <span className={cn("tabular-nums", result.yearlyProfit >= 0 ? "text-green-600" : "text-red-600")}>
              {formatCurrency(result.yearlyProfit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
