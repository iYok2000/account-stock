"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Target, DollarSign, Tag, Lock, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { SlidersPanel } from "@/components/calculator/SlidersPanel";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { AnalysisSection } from "@/components/calculator/AnalysisSection";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, cn } from "@/lib/utils";
import {
  calculateLocal, getHappiness, calcBreakEven, calcSensitivity, calcScenarios, calcMonteCarlo,
  type SliderKey,
} from "@/lib/calculator/engine";

// ─── Happiness face config (de‑emphasized block) ─────────────────────────────
const FACES = [
  { emoji: "😢", bg: "bg-red-100 dark:bg-red-950/40",    text: "text-red-600 dark:text-red-400"   },
  { emoji: "😐", bg: "bg-brown-100 dark:bg-brown-950/40",  text: "text-brown-600 dark:text-brown-400" },
  { emoji: "😊", bg: "bg-brown-200 dark:bg-brown-900/40",  text: "text-brown-700 dark:text-brown-300" },
  { emoji: "🤩", bg: "bg-brown-300 dark:bg-brown-800/40", text: "text-brown-800 dark:text-brown-200" },
];

// ─── CSS bar charts (no library) ─────────────────────────────────────────────
function CostBars({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + Math.max(d.value, 0), 0);
  if (total === 0) return <p className="text-sm text-muted-foreground py-4 text-center">—</p>;
  return (
    <div className="space-y-2">
      {data.filter((d) => d.value > 0).map((d) => {
        const pct = (d.value / total) * 100;
        return (
          <div key={d.name}>
            <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
              <span>{d.name}</span>
              <span className="tabular-nums">{formatCurrency(d.value)} ({pct.toFixed(1)}%)</span>
            </div>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="h-3 rounded-full transition-all duration-300" style={{ width: `${pct}%`, backgroundColor: d.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Waterfall({ data }: { data: { name: string; value: number; isTotal?: boolean }[] }) {
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
  return (
    <div className="space-y-1.5">
      {data.map((d, i) => {
        const neg = d.value < 0;
        const pct = (Math.abs(d.value) / maxAbs) * 100;
        const bar = d.isTotal ? "bg-primary" : neg ? "bg-red-400" : "bg-brown-500";
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-xs text-muted-foreground text-right truncate shrink-0">{d.name}</span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div className={cn("h-5 rounded transition-all duration-300", bar)} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
            <span className={cn("w-24 text-xs text-right tabular-nums shrink-0", neg ? "text-red-600" : "text-brown-600")}>
              {neg ? "-" : "+"}{formatCurrency(Math.abs(d.value))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function CalculatorPage() {
  const t = useTranslations("calculator");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showFeeDetails, setShowFeeDetails] = useState(false);
  const [showCostDetails, setShowCostDetails] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Slider state — default values similar to Congrats-Seller
  const [priceMode, setPriceMode] = useState<"list" | "selling">("selling");
  const [listPrice, setListPrice] = useState(599);
  const [sellingPrice, setSellingPrice] = useState(499);
  const [productCost, setProductCost] = useState(200);
  const [shippingCost, setShippingCost] = useState(40);
  const [affiliateRate, setAffiliateRate] = useState(5);
  const [adSpend, setAdSpend] = useState(0);
  const [packagingCost, setPackagingCost] = useState(5);
  const [quantity, setQuantity] = useState(100);
  const [returnRate, setReturnRate] = useState(5);
  const [lockedSliders, setLockedSliders] = useState<Set<SliderKey>>(new Set());
  const [goalInput, setGoalInput] = useState("");
  const [goalProfit, setGoalProfit] = useState<number | null>(null);
  const [goalError, setGoalError] = useState<string | null>(null);

  const activePrice = priceMode === "list" ? listPrice : sellingPrice;
  const discountPct = listPrice > 0 ? ((listPrice - sellingPrice) / listPrice) * 100 : 0;

  const toggleLock = useCallback((key: SliderKey) => {
    setLockedSliders((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  const baseParams = useMemo(() => ({
    sellingPrice: activePrice, productCost, shippingCost, affiliateRate,
    adSpend, packagingCost, quantity, returnRate: returnRate / 100,
  }), [activePrice, productCost, shippingCost, affiliateRate, adSpend, packagingCost, quantity, returnRate]);

  const result     = useMemo(() => calculateLocal(baseParams), [baseParams]);
  const happiness  = useMemo(() => getHappiness(result.profitMargin, result.platformFeesPct, result.shippingPct, discountPct), [result, discountPct]);
  const breakEven  = useMemo(() => calcBreakEven({ activePrice, productCost, packagingCost, shippingCost, adSpend, affiliateRate, returnRate, profitPerUnit: result.profitPerUnit }), [activePrice, productCost, packagingCost, shippingCost, adSpend, affiliateRate, returnRate, result.profitPerUnit]);
  const sensitivity= useMemo(() => calcSensitivity(baseParams, result.profitPerUnit), [baseParams, result.profitPerUnit]);
  const scenarios  = useMemo(() => calcScenarios(baseParams), [baseParams]);
  const monte      = useMemo(() => calcMonteCarlo(baseParams), [baseParams]);

  // Sticky bar accent color based on profit - brown palette
  const stickyAccent = result.profitMargin >= 15
    ? { border: "border-brown-500", gradient: "#b37c57", dot: "bg-brown-500", text: "text-brown-600", bg: "bg-brown-500/10" }
    : result.profitMargin >= 0
      ? { border: "border-brown-400", gradient: "#d1a380", dot: "bg-brown-400", text: "text-brown-500", bg: "bg-brown-400/10" }
      : { border: "border-red-500", gradient: "#ef4444", dot: "bg-red-500", text: "text-red-600", bg: "bg-red-500/10" };

  const handleGoalSet = useCallback(() => {
    const target = parseFloat(goalInput);
    if (isNaN(target)) {
      setGoalError(t("goalErrorNaN") || "กรุณากรอกตัวเลข");
      return;
    }
    if (target < 0) {
      setGoalError(t("goalErrorNegative") || "เป้ากำไรต้องไม่ติดลบ");
      return;
    }
    setGoalError(null);
    setGoalProfit(target);
    const deficit = target - result.profitPerUnit;
    if (Math.abs(deficit) < 0.01) return;
    const adj: { key: SliderKey; value: number; setter: (v: number) => void }[] = [];
    if (!lockedSliders.has("productCost"))  adj.push({ key: "productCost",  value: productCost,  setter: setProductCost });
    if (!lockedSliders.has("shippingCost")) adj.push({ key: "shippingCost", value: shippingCost, setter: setShippingCost });
    if (!lockedSliders.has("adSpend"))      adj.push({ key: "adSpend",      value: adSpend,      setter: setAdSpend });
    if (!lockedSliders.has("packagingCost"))adj.push({ key: "packagingCost",value: packagingCost,setter: setPackagingCost });
    if (!adj.length) return;
    const sum = adj.reduce((s, a) => s + a.value, 0);
    adj.forEach((a) => {
      const share = sum > 0 ? a.value / sum : 1 / adj.length;
      a.setter(Math.max(0, Math.round((a.value - deficit * share) * 100) / 100));
    });
  }, [goalInput, result.profitPerUnit, lockedSliders, productCost, shippingCost, adSpend, packagingCost, t]);

  const handleCopySummary = useCallback(async () => {
    const lines = [
      t("title"),
      `Profit/unit: ${formatCurrency(result.profitPerUnit)} | Margin: ${result.profitMargin.toFixed(1)}%`,
      `Monthly profit: ${formatCurrency(result.monthlyProfit)} | Revenue: ${formatCurrency(result.monthlyRevenue)}`,
      `Quantity: ${quantity} | Return rate: ${returnRate}%`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      setCopySuccess(false);
    }
  }, [t, result, quantity, returnRate]);

  const happinessItems = [
    { labelKey: "seller", score: happiness.sellerScore, icon: "🛍️" },
    { labelKey: "platform", score: happiness.tiktokScore, icon: "📱" },
    { labelKey: "shipping", score: happiness.shippingScore, icon: "🚚" },
    { labelKey: "customer", score: happiness.customerScore, icon: "👤" },
  ] as const;
  const faceLabels = ["sad", "ok", "happy", "great"] as const;

  return (
    <div className="space-y-8">
      {/* 1) Header + Mode + API note */}
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
            {copySuccess ? <Check className="h-3.5 w-3.5 text-brown-600" /> : <Copy className="h-3.5 w-3.5" />}
            {copySuccess ? t("exportCopied") : t("exportCopy")}
          </button>
        </div>
      </div>

      <div className="rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <span>⏳</span><span>{t("apiNote")}</span>
      </div>

      {/* Simple / Advanced mode */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">{t("modeHint")}</span>
        <div className="flex rounded-lg border border-border overflow-hidden bg-muted/30">
          {[
            { mode: false, label: t("modeSimple") },
            { mode: true,  label: t("modeAdvanced") },
          ].map(({ mode, label }) => (
            <button
              key={String(mode)}
              type="button"
              onClick={() => setAdvancedMode(mode)}
              className={cn(
                "px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors min-h-[44px] sm:min-h-0",
                advancedMode === mode ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground hover:bg-muted"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Price mode toggle */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-foreground">{t("calcFrom")}</span>
        <div className="flex rounded-md border border-border overflow-hidden">
          {(["selling", "list"] as const).map((mode) => (
            <button key={mode} onClick={() => setPriceMode(mode)} className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
              priceMode === mode ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted text-foreground",
              mode === "list" && "border-l border-border"
            )}>
              {mode === "selling" ? <DollarSign className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
              {t(mode === "selling" ? "sellingPrice" : "listPrice")}
            </button>
          ))}
        </div>
      </div>

      {/* 2) Input (grouped) + Main results — above the fold */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SlidersPanel
          listPrice={listPrice} setListPrice={setListPrice}
          sellingPrice={sellingPrice} setSellingPrice={setSellingPrice}
          productCost={productCost} setProductCost={setProductCost}
          quantity={quantity} setQuantity={setQuantity}
          shippingCost={shippingCost} setShippingCost={setShippingCost}
          affiliateRate={affiliateRate} setAffiliateRate={setAffiliateRate}
          adSpend={adSpend} setAdSpend={setAdSpend}
          packagingCost={packagingCost} setPackagingCost={setPackagingCost}
          returnRate={returnRate} setReturnRate={setReturnRate}
          lockedSliders={lockedSliders} toggleLock={toggleLock}
          priceMode={priceMode} discountPct={discountPct}
          simpleMode={!advancedMode}
        />
        <div className="space-y-4">
          {/* Main KPIs — prominent, mobile-first stacked */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="card text-center py-4 sm:py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("results.profitPerUnit")}</p>
              <p className={cn("text-2xl sm:text-xl font-bold tabular-nums mt-1 transition-colors", result.profitPerUnit >= 0 ? "text-brown-600 dark:text-brown-400" : "text-red-600 dark:text-red-400")}>
                {formatCurrency(result.profitPerUnit)}
              </p>
            </div>
            <div className="card text-center py-4 sm:py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Margin</p>
              <p className={cn("text-2xl sm:text-xl font-bold tabular-nums mt-1", result.profitMargin >= 30 ? "text-brown-600" : result.profitMargin >= 15 ? "text-brown-500" : "text-red-600")}>
                {result.profitMargin.toFixed(1)}%
              </p>
            </div>
            <div className="card text-center py-4 sm:py-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">{t("results.perMonth")}</p>
              <p className={cn("text-2xl sm:text-xl font-bold tabular-nums mt-1", result.monthlyProfit >= 0 ? "text-brown-600 dark:text-brown-400" : "text-red-600 dark:text-red-400")}>
                {formatCurrency(result.monthlyProfit)}
              </p>
            </div>
          </div>

          {/* Fee Breakdown - Collapsible */}
          <div className="border-t border-border/50 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowFeeDetails(!showFeeDetails)}
              className="flex items-center justify-between w-full text-left"
            >
              <span className="text-sm font-medium text-foreground">{t("charts.feeDetails") || "รายละเอียดค่าธรรมเนียม"}</span>
              {showFeeDetails ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            {showFeeDetails && (
              <div className="mt-4">
                <ResultsPanel
                  result={result} activePrice={activePrice} listPrice={listPrice}
                  productCost={productCost} packagingCost={packagingCost} shippingCost={shippingCost}
                  affiliateRate={affiliateRate} adSpend={adSpend}
                  quantity={quantity} returnRate={returnRate} priceMode={priceMode} goalProfit={goalProfit}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3) Goal + Lock Grid */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1 text-foreground">
              <Target className="h-4 w-4 text-primary" />{t("goalLabel")}
            </label>
            <input type="number" value={goalInput} onChange={(e) => { setGoalInput(e.target.value); if (goalError) setGoalError(null); }}
              placeholder={t("goalPlaceholder")} className={cn("input-base h-10 w-full", goalError && "border-red-400 focus:border-red-500")} />
            {goalError && <p className="text-xs text-red-500 mt-1">{goalError}</p>}
          </div>
          <button onClick={handleGoalSet} disabled={!goalInput}
            className="btn-primary flex items-center gap-1.5 shrink-0 disabled:opacity-50">
            <Target className="h-4 w-4" />{t("goalBtn")}
          </button>
          {goalProfit !== null && (
            <div className="text-sm text-muted-foreground">
              {t("goalTarget")}: <span className="font-medium text-primary">{formatCurrency(goalProfit)}/ชิ้น</span>
              {" · "}{t("goalCurrent")}:{" "}
              <span className={cn("font-medium", result.profitPerUnit >= goalProfit ? "text-brown-600" : "text-red-600")}>
                {formatCurrency(result.profitPerUnit)}/ชิ้น
              </span>
            </div>
          )}
        </div>

        {/* Lock Grid */}
        <div className="border-t border-border/50 pt-4 mt-4">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 mb-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            {t("goalLockTitle") || "ล็อคค่าที่ไม่ต้องการให้ปรับ"}
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            {t("goalLockHint") || "ค่าที่ถูกล็อคจะไม่ถูกเปลี่ยนเมื่อกด 'คำนวณย้อนกลับ'"}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 border border-border/50 p-2 rounded-xl bg-muted/30">
            {([
              { key: "sellingPrice" as SliderKey, label: t("sellingPrice"), value: formatCurrency(activePrice) },
              { key: "productCost" as SliderKey, label: t("productCost"), value: formatCurrency(productCost) },
              { key: "packagingCost" as SliderKey, label: t("packagingCost"), value: formatCurrency(packagingCost) },
              { key: "shippingCost" as SliderKey, label: t("shippingCost"), value: formatCurrency(shippingCost) },
              { key: "adSpend" as SliderKey, label: t("adSpend"), value: formatCurrency(adSpend) },
              { key: "affiliateRate" as SliderKey, label: t("affiliateRate"), value: `${affiliateRate}%` },
              { key: "returnRate" as SliderKey, label: t("returnRate"), value: `${returnRate}%` },
            ]).map((item) => (
              <label
                key={item.key}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-all",
                  lockedSliders.has(item.key)
                    ? "border-primary/50 bg-primary/5 shadow-sm"
                    : "border-border bg-background hover:bg-muted/50"
                )}
              >
                <Switch
                  checked={lockedSliders.has(item.key)}
                  onCheckedChange={() => toggleLock(item.key)}
                  className="shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[13px] font-medium text-foreground block truncate">{item.label}</span>
                  <span className="text-[11px] font-mono text-muted-foreground">{item.value}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground/90 mt-4 text-center">
          {t("goalReverseDesc")}
        </p>
      </div>

      {/* 4) Cost + Waterfall charts - Collapsible */}
      <div className="card">
        <button
          type="button"
          onClick={() => setShowCostDetails(!showCostDetails)}
          className="flex items-center justify-between w-full text-left"
        >
          <span className="text-sm font-medium text-foreground">{t("charts.costChartTitle") || "สรุปต้นทุนและกำไร"}</span>
          {showCostDetails ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {showCostDetails && (
          <div className="grid gap-6 lg:grid-cols-2 mt-4">
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("charts.costTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("charts.costSubtitle")}</p>
              <CostBars data={[
                { name: t("charts.productCost"), value: productCost, color: "#6B4226" },
                { name: t("charts.packaging"),   value: packagingCost, color: "#8B6E4E" },
                { name: t("charts.shippingFee"), value: shippingCost, color: "#A67C52" },
                { name: t("charts.commissionVat"), value: result.commissionPerUnit + result.commissionVatPerUnit, color: "#C8975E" },
                { name: t("charts.paymentFee"),  value: result.paymentFeePerUnit, color: "#D4A76A" },
                { name: t("charts.affiliate"),   value: result.affiliateFeePerUnit, color: "#B85C38" },
                { name: t("charts.adSpend"),     value: adSpend, color: "#9B3B1F" },
              ]} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("charts.waterfallTitle")}</h3>
              <p className="text-sm text-muted-foreground mb-4">{t("charts.waterfallSubtitle")}</p>
              <Waterfall data={[
                { name: t("charts.revenue"),     value: result.revenueGross },
                { name: t("charts.return"),      value: -(result.revenueGross - result.revenueNet) },
                { name: t("charts.productCost"), value: -result.totalProductCost },
                { name: t("charts.shippingFee"), value: -result.totalShipping },
                { name: t("charts.platformFee"), value: -result.totalPlatformFees },
                { name: t("charts.adSpend"),     value: -(adSpend * quantity) },
                { name: t("charts.netProfit"),   value: result.monthlyProfit, isTotal: true },
              ]} />
            </div>
          </div>
        )}
      </div>

      {/* 5) Breakeven + Scenarios + Sensitivity + Monte Carlo (AnalysisSection) — only in Advanced */}
      {advancedMode && (
        <AnalysisSection
          breakEven={breakEven} sensitivity={sensitivity} scenarios={scenarios} monte={monte}
          activePrice={activePrice} productCost={productCost} returnRate={returnRate}
        />
      )}

      {/* 7) Happiness — bottom, de‑emphasized */}
      <section className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">{t("happinessBlockTitle")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {happinessItems.map(({ labelKey, score, icon }) => {
            const face = FACES[Math.min(score, 3)];
            return (
              <div key={labelKey} className={cn("flex flex-col items-center gap-1 rounded-lg p-3", face.bg)}>
                <span className="text-lg">{icon}</span>
                <span className="text-2xl">{face.emoji}</span>
                <span className={cn("text-xs font-medium", face.text)}>{t(`happiness.${labelKey}`)}</span>
                <span className={cn("text-[10px]", face.text)}>{t(`happiness.${faceLabels[Math.min(score, 3)]}`)}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Sticky Profit Bar — mobile only */}
      <div
        ref={resultsRef}
        suppressHydrationWarning
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 lg:hidden border-t-2",
          stickyAccent.border,
          "touch-manipulation shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.15)] overflow-hidden transition-all duration-500",
          "bg-background/95 backdrop-blur-md"
        )}
        onClick={() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <div className="flex items-center gap-1.5">
            <div className={cn("w-2 h-2 rounded-full flex-shrink-0", stickyAccent.dot)} />
            <span className="text-xs text-muted-foreground">กำไร</span>
            <span className={cn("text-xl font-bold tabular-nums", stickyAccent.text)}>
              {formatCurrency(result.profitPerUnit)}
            </span>
            <span className="text-xs text-muted-foreground">/ชิ้น</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-0.5">
            <span className={cn("text-base font-bold tabular-nums", stickyAccent.text)}>
              {result.profitMargin.toFixed(1)}
            </span>
            <span className="text-xs text-muted-foreground">%</span>
          </div>
          <div className="w-px h-5 bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tabular-nums text-foreground">
              {formatCurrency(result.monthlyProfit)}
            </span>
            <span className="text-xs text-muted-foreground">/ด</span>
          </div>
        </div>
      </div>

      {/* Spacer for sticky bar on mobile */}
      <div className="h-20 lg:hidden" />
    </div>
  );
}
