"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Receipt, Calculator, FileText, PiggyBank, Copy, Check, ChevronDown } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency, cn } from "@/lib/utils";

const TAX_BRACKETS = [
  { upTo: 150_000, rate: 0 },
  { upTo: 300_000, rate: 5 },
  { upTo: 500_000, rate: 10 },
  { upTo: 750_000, rate: 15 },
  { upTo: 1_000_000, rate: 20 },
  { upTo: 2_000_000, rate: 25 },
  { upTo: 5_000_000, rate: 30 },
  { upTo: Infinity, rate: 35 },
];

function calcTax(taxableIncome: number) {
  let tax = 0;
  let prev = 0;
  const breakdown: { from: number; to: number; rate: number; tax: number }[] = [];
  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= prev) break;
    const inBracket = Math.min(taxableIncome, b.upTo) - prev;
    const bracketTax = inBracket * (b.rate / 100);
    tax += bracketTax;
    if (inBracket > 0) breakdown.push({ from: prev, to: Math.min(taxableIncome, b.upTo), rate: b.rate, tax: bracketTax });
    prev = b.upTo;
  }
  return { total: tax, breakdown };
}

function getBracketLabel(taxableIncome: number): string {
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    if (taxableIncome <= TAX_BRACKETS[i].upTo) {
      const b = TAX_BRACKETS[i];
      const prev = i === 0 ? 0 : TAX_BRACKETS[i - 1].upTo;
      if (b.rate === 0) return `0 – ${(b.upTo / 1_000_000).toFixed(1)}M (${b.rate}%)`;
      return `${(prev / 1_000).toFixed(0)}K – ${(b.upTo === Infinity ? "∞" : (b.upTo / 1_000).toFixed(0) + "K")} (${b.rate}%)`;
    }
  }
  return "35%";
}

export default function TaxPage() {
  const t = useTranslations("tax");
  const [copySuccess, setCopySuccess] = useState(false);

  const [grossIncome, setGrossIncome] = useState(0);
  const [deductionMethod, setDeductionMethod] = useState<"flat" | "itemized">("flat");
  const [socialSecurity, setSocialSecurity] = useState(0);
  const [lifeInsurance, setLifeInsurance] = useState(0);
  const [ssfRmf, setSsfRmf] = useState(0);
  const [donations, setDonations] = useState(0);
  const [otherDeductions, setOtherDeductions] = useState(0);
  const [itemizedExpenses, setItemizedExpenses] = useState(0);

  const result = useMemo(() => {
    const personalDeduction = 60_000;
    const flatExpenseDeduction = grossIncome * 0.6;
    const expenseDeduction = deductionMethod === "flat" ? flatExpenseDeduction : itemizedExpenses;
    const totalPersonalAllowances = personalDeduction + socialSecurity + lifeInsurance + ssfRmf + donations + otherDeductions;
    const totalAllowances = expenseDeduction + totalPersonalAllowances;
    const taxableIncome = Math.max(grossIncome - totalAllowances, 0);
    const taxResult = calcTax(taxableIncome);
    const withholdingTax = grossIncome * 0.03;
    const netTaxPayable = taxResult.total - withholdingTax;
    const isRefund = netTaxPayable < 0;
    return {
      grossIncome,
      expenseDeduction,
      personalDeduction,
      totalPersonalAllowances,
      totalAllowances,
      taxableIncome,
      estimatedTax: taxResult.total,
      taxBreakdown: taxResult.breakdown,
      withholdingTax,
      netTaxDue: Math.max(netTaxPayable, 0),
      isRefund,
      refundAmount: Math.abs(Math.min(netTaxPayable, 0)),
      effectiveRate: grossIncome > 0 ? (taxResult.total / grossIncome) * 100 : 0,
      flatExpenseDeduction,
      usingFlat: deductionMethod === "flat",
      bracketLabel: getBracketLabel(taxableIncome),
    };
  }, [grossIncome, deductionMethod, itemizedExpenses, socialSecurity, lifeInsurance, ssfRmf, donations, otherDeductions]);

  const handleCopySummary = useCallback(async () => {
    const lines = [
      t("title"),
      `${t("summaryGross")}: ${formatCurrency(result.grossIncome)}`,
      `${t("summaryTaxable")}: ${formatCurrency(result.taxableIncome)}`,
      result.isRefund
        ? `${t("summaryRefund")}: ${formatCurrency(result.refundAmount)}`
        : `${t("summaryTaxDue")}: ${formatCurrency(result.netTaxDue)}`,
      `${t("effectiveRate")}: ${result.effectiveRate.toFixed(2)}%`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [t, result]);

  return (
    <div className="space-y-8">
      {/* Header + Export */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
            {t("localPreview")}
          </span>
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors"
          >
            {copySuccess ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copySuccess ? t("exportCopied") : t("exportCopy")}
          </button>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <span>⏳</span>
        <span>{t("apiNote")}</span>
      </div>

      {/* Hero: คุณอยู่ในฐานไหน + เสีย/ได้คืนกี่บาท (research: summary prominent) */}
      <section className="rounded-xl border border-border bg-muted/20 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {t("heroWhereYouStand")}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-0.5">{t("heroBracket")}</p>
            <p className="text-lg font-semibold text-foreground tabular-nums">{result.bracketLabel}</p>
          </div>
          <div className="text-right">
            {result.taxableIncome <= 150_000 ? (
              <p className="text-2xl sm:text-3xl font-bold text-muted-foreground">{t("heroNoTax")}</p>
            ) : result.isRefund ? (
              <>
                <p className="text-sm text-muted-foreground mb-0.5">{t("heroYouGetBack")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400 tabular-nums">
                  {formatCurrency(result.refundAmount)}
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-0.5">{t("heroYouOwe")}</p>
                <p className="text-2xl sm:text-3xl font-bold text-red-600 dark:text-red-400 tabular-nums">
                  {formatCurrency(result.netTaxDue)}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Summary cards (research: simple numeric summaries) */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: t("summaryGross"), value: formatCurrency(result.grossIncome), icon: Receipt },
          { title: t("summaryDeductions"), value: formatCurrency(result.totalAllowances), icon: PiggyBank },
          { title: t("summaryTaxable"), value: formatCurrency(result.taxableIncome), icon: Calculator },
          {
            title: result.isRefund ? t("summaryRefund") : t("summaryTaxDue"),
            value: result.isRefund ? formatCurrency(result.refundAmount) : formatCurrency(result.netTaxDue),
            icon: FileText,
            cls: result.isRefund ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          },
        ].map(({ title, value, icon: Icon, cls }) => (
          <div key={title} className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              <p className={cn("text-base font-bold tabular-nums", cls ?? "text-foreground")}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input + Result (grouped: sales input → taxable → tax → tips) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card space-y-5">
          <div className="mb-1">
            <h3 className="font-semibold text-foreground">{t("inputTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t("inputSubtitle")}</p>
          </div>

          <Slider label={t("incomeLabel")} value={grossIncome} onChange={setGrossIncome} min={0} max={10_000_000} step={10_000} prefix="฿" />

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("deductionMethod")}</label>
            <div className="flex gap-3">
              {(["flat", "itemized"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setDeductionMethod(m)}
                  className={cn(
                    "flex-1 px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                    deductionMethod === m
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background border-border hover:bg-muted text-foreground"
                  )}
                >
                  {m === "flat" ? t("deductionFlat") : t("deductionItemized")}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {deductionMethod === "flat"
                ? `${t("deductionFlatHint")} = ${formatCurrency(result.flatExpenseDeduction)}`
                : `${t("deductionItemizedHint")} = ${formatCurrency(itemizedExpenses)}`}
            </p>
          </div>

          {deductionMethod === "itemized" && (
            <Slider label={t("itemizedLabel")} value={itemizedExpenses} onChange={setItemizedExpenses} min={0} max={grossIncome} step={10_000} prefix="฿" />
          )}

          <div className="border-t border-border pt-3">
            <p className="text-sm font-medium text-foreground mb-3">{t("allowancesTitle")}</p>
            <p className="text-xs text-muted-foreground mb-3">{t("personalFixed")}: {formatCurrency(60_000)}</p>
            <div className="space-y-4">
              <Slider label={t("socialSecurity")} value={socialSecurity} onChange={setSocialSecurity} min={0} max={9_000} step={100} prefix="฿" />
              <Slider label={t("lifeInsurance")} value={lifeInsurance} onChange={setLifeInsurance} min={0} max={100_000} step={1_000} prefix="฿" />
              <Slider label={t("ssfRmf")} value={ssfRmf} onChange={setSsfRmf} min={0} max={500_000} step={5_000} prefix="฿" />
              <Slider label={t("donations")} value={donations} onChange={setDonations} min={0} max={100_000} step={1_000} prefix="฿" />
              <Slider label={t("otherAllowances")} value={otherDeductions} onChange={setOtherDeductions} min={0} max={200_000} step={1_000} prefix="฿" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card space-y-2 text-sm">
            <div className="mb-2">
              <h3 className="font-semibold text-foreground">{t("resultTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t("resultSubtitle")}</p>
            </div>

            {[
              { l: t("summaryGross"), v: formatCurrency(result.grossIncome), cls: "font-medium" },
              { l: result.usingFlat ? t("deductionFlat") : t("deductionItemized"), v: `-${formatCurrency(result.expenseDeduction)}`, cls: "text-muted-foreground" },
              { l: t("personalFixed"), v: `-${formatCurrency(result.personalDeduction)}`, cls: "text-muted-foreground" },
              socialSecurity > 0 ? { l: t("socialSecurity"), v: `-${formatCurrency(socialSecurity)}`, cls: "text-muted-foreground" } : null,
              lifeInsurance > 0 ? { l: t("lifeInsurance"), v: `-${formatCurrency(lifeInsurance)}`, cls: "text-muted-foreground" } : null,
              ssfRmf > 0 ? { l: t("ssfRmf"), v: `-${formatCurrency(ssfRmf)}`, cls: "text-muted-foreground" } : null,
              donations > 0 ? { l: t("donations"), v: `-${formatCurrency(donations)}`, cls: "text-muted-foreground" } : null,
              otherDeductions > 0 ? { l: t("otherAllowances"), v: `-${formatCurrency(otherDeductions)}`, cls: "text-muted-foreground" } : null,
            ]
              .filter(Boolean)
              .map((row) => row && (
                <div key={row.l} className={cn("flex justify-between py-1 border-b border-border/50", row.cls)}>
                  <span>{row.l}</span>
                  <span>{row.v}</span>
                </div>
              ))}

            <div className="flex justify-between py-2 border-t font-medium">
              <span>{t("summaryTaxable")}</span>
              <span>{formatCurrency(result.taxableIncome)}</span>
            </div>

            <div className="flex justify-between py-2 border-t font-bold">
              <span>{t("summaryTaxDue")}</span>
              <span className="text-red-600 dark:text-red-400">{formatCurrency(result.estimatedTax)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>{t("withholdingLabel")}</span>
              <span>-{formatCurrency(result.withholdingTax)}</span>
            </div>
            <div className={cn("flex justify-between py-3 border-t-2 border-foreground/20")}>
              <span className="text-base font-bold">
                {result.isRefund ? t("refundLabel") : t("netDueLabel")}
              </span>
              <span className={cn("text-base font-bold tabular-nums", result.isRefund ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                {result.isRefund ? formatCurrency(result.refundAmount) : formatCurrency(result.netTaxDue)}
              </span>
            </div>

            {result.isRefund && (
              <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                <p className="text-sm text-green-800 dark:text-green-200">{t("refundNote")}</p>
              </div>
            )}

            <div className="flex justify-between pt-1 text-muted-foreground text-xs">
              <span>{t("effectiveRate")}</span>
              <span className="font-medium">{result.effectiveRate.toFixed(2)}%</span>
            </div>
          </div>

          {/* Tips (research: easy-to-understand, SME-focused, layman terms) */}
          <div className="card space-y-2 text-sm">
            <h4 className="font-semibold text-foreground">{t("tipsTitle")}</h4>
            {ssfRmf < 200_000 && (
              <p className="text-muted-foreground">
                {t("tipsSsfRmf")} {t("tipsSsfRmfHint", { amount: formatCurrency(Math.min(200_000, 500_000 - ssfRmf)), saving: formatCurrency(Math.min(200_000, 500_000 - ssfRmf) * 0.1) })}
              </p>
            )}
            {lifeInsurance < 100_000 && (
              <p className="text-muted-foreground">{t("tipsLifeInsurance")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible: Bracket breakdown (research: collapsible for detail) */}
      <details className="group/tax card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-2 px-3 font-semibold text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open/tax:rotate-180" />
          <span>{t("detailBreakdown")}</span>
        </summary>
        <div className="pt-2 pb-1">
          {result.taxBreakdown.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-1.5 px-2 font-medium">{t("summaryTaxable")}</th>
                    <th className="text-center py-1.5 px-2 font-medium">%</th>
                    <th className="text-right py-1.5 px-2 font-medium">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {result.taxBreakdown.map((b, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1.5 px-2">{b.from.toLocaleString()} – {b.to === Infinity ? "…" : b.to.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-center">{b.rate === 0 ? "0" : `${b.rate}%`}</td>
                      <td className="py-1.5 px-2 text-right">{formatCurrency(b.tax)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/50 font-medium">
                    <td className="py-1.5 px-2" colSpan={2}>Total</td>
                    <td className="py-1.5 px-2 text-right">{formatCurrency(result.estimatedTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </details>

      {/* Collapsible: Full rate table (research: separate detailed info) */}
      <details className="group/tax card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-2 px-3 font-semibold text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open/tax:rotate-180" />
          <span>{t("detailRates")}</span>
        </summary>
        <div className="pt-2 pb-1">
          <p className="text-sm text-muted-foreground mb-3">{t("bracketSubtitle")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium">{t("summaryTaxable")} (THB)</th>
                  <th className="text-center py-2 px-3 font-medium">%</th>
                  <th className="text-right py-2 px-3 font-medium">Max in bracket</th>
                </tr>
              </thead>
              <tbody>
                {TAX_BRACKETS.map((bracket, i) => {
                  const prevLimit = i === 0 ? 0 : TAX_BRACKETS[i - 1].upTo;
                  const bracketWidth = bracket.upTo === Infinity ? 0 : bracket.upTo - prevLimit;
                  return (
                    <tr key={i} className="border-b border-border last:border-0">
                      <td className="py-2 px-3">
                        {i === 0 ? "0" : (prevLimit + 1).toLocaleString()} –{" "}
                        {bracket.upTo === Infinity ? "…" : bracket.upTo.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {bracket.rate === 0 ? "0" : `${bracket.rate}%`}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {bracket.upTo === Infinity ? "–" : formatCurrency(bracketWidth * (bracket.rate / 100))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </details>
    </div>
  );
}
