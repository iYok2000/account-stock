"use client";

import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Target, DollarSign, Tag, Lock } from "lucide-react";
import { Slider as SliderComponent } from "@/components/ui/Slider";
import { SlidersPanel } from "@/components/calculator/SlidersPanel";
import { ResultsPanel } from "@/components/calculator/ResultsPanel";
import { AnalysisSection } from "@/components/calculator/AnalysisSection";
import { formatCurrency, cn } from "@/lib/utils";
import {
  calculateLocal, getHappiness, calcBreakEven, calcSensitivity, calcScenarios, calcMonteCarlo,
  FEE, type SliderKey,
} from "@/lib/calculator/engine";

// ─── Happiness face config ────────────────────────────────────────────────────
const FACES = [
  { emoji: "😢", bg: "bg-red-100",    text: "text-red-600"   },
  { emoji: "😐", bg: "bg-amber-100",  text: "text-amber-600" },
  { emoji: "😊", bg: "bg-green-100",  text: "text-green-600" },
  { emoji: "🤩", bg: "bg-emerald-100",text: "text-emerald-600"},
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
        const bar = d.isTotal ? "bg-primary" : neg ? "bg-red-400" : "bg-green-500";
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="w-24 text-xs text-muted-foreground text-right truncate shrink-0">{d.name}</span>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div className={cn("h-5 rounded transition-all duration-300", bar)} style={{ width: `${Math.max(pct, 1)}%` }} />
            </div>
            <span className={cn("w-24 text-xs text-right tabular-nums shrink-0", neg ? "text-red-600" : "text-green-600")}>
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

  // Slider state
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

  const activePrice = priceMode === "list" ? listPrice : sellingPrice;
  const discountPct = listPrice > 0 ? ((listPrice - sellingPrice) / listPrice) * 100 : 0;

  const toggleLock = useCallback((key: SliderKey) => {
    setLockedSliders((prev) => { const n = new Set(prev); n.has(key) ? n.delete(key) : n.add(key); return n; });
  }, []);

  // Core calculation
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

  // Reverse-goal solver
  const handleGoalSet = useCallback(() => {
    const target = parseFloat(goalInput);
    if (isNaN(target)) return;
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
  }, [goalInput, result.profitPerUnit, lockedSliders, productCost, shippingCost, adSpend, packagingCost]);

  const happinessItems = [
    { labelKey: "seller", score: happiness.sellerScore, icon: "🛍️" },
    { labelKey: "platform", score: happiness.tiktokScore, icon: "📱" },
    { labelKey: "shipping", score: happiness.shippingScore, icon: "🚚" },
    { labelKey: "customer", score: happiness.customerScore, icon: "👤" },
  ] as const;

  const faceLabels = ["sad", "ok", "happy", "great"] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <span className="self-start inline-flex items-center rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-muted-foreground">
          {t("localPreview")}
        </span>
      </div>

      {/* API note */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span><span>{t("apiNote")}</span>
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

      {/* Happiness Indicators */}
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

      {/* Goal setting */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-sm font-medium flex items-center gap-1.5 mb-1 text-foreground">
              <Target className="h-4 w-4 text-primary" />{t("goalLabel")}
            </label>
            <input type="number" value={goalInput} onChange={(e) => setGoalInput(e.target.value)}
              placeholder={t("goalPlaceholder")} className="input-base h-10 w-full" />
          </div>
          <button onClick={handleGoalSet} disabled={!goalInput}
            className="btn-primary flex items-center gap-1.5 shrink-0 disabled:opacity-50">
            <Target className="h-4 w-4" />{t("goalBtn")}
          </button>
          {goalProfit !== null && (
            <div className="text-sm text-muted-foreground">
              {t("goalTarget")}: <span className="font-medium text-primary">{formatCurrency(goalProfit)}/ชิ้น</span>
              {" · "}{t("goalCurrent")}:{" "}
              <span className={cn("font-medium", result.profitPerUnit >= goalProfit ? "text-green-600" : "text-red-600")}>
                {formatCurrency(result.profitPerUnit)}/ชิ้น
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <Lock className="h-3 w-3" />{t("goalHint")}
        </p>
      </div>

      {/* Summary KPI cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { label: t("stats.netRevenue"), value: formatCurrency(result.monthlyRevenue) },
          { label: t("stats.totalCost"),  value: formatCurrency(result.monthlyCost) },
          { label: t("stats.netProfit"),  value: formatCurrency(result.monthlyProfit), cls: result.monthlyProfit >= 0 ? "text-green-600" : "text-red-600" },
          { label: `${t("stats.return")} ${returnRate}%`, value: `${result.returnedUnits} ชิ้น` },
        ].map(({ label, value, cls }) => (
          <div key={label} className="card">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={cn("text-xl font-bold mt-1", cls ?? "text-foreground")}>{value}</p>
          </div>
        ))}
      </div>

      {/* Main 2-col */}
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
        />
        <ResultsPanel
          result={result} activePrice={activePrice} listPrice={listPrice}
          productCost={productCost} packagingCost={packagingCost} shippingCost={shippingCost}
          affiliateRate={affiliateRate} adSpend={adSpend}
          quantity={quantity} returnRate={returnRate} priceMode={priceMode} goalProfit={goalProfit}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
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
        <div className="card">
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

      {/* Analysis section */}
      <AnalysisSection
        breakEven={breakEven} sensitivity={sensitivity} scenarios={scenarios} monte={monte}
        activePrice={activePrice} productCost={productCost} returnRate={returnRate}
      />
    </div>
  );
}
