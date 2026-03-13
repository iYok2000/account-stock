"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import {
  Receipt, Calculator, FileText, PiggyBank, Copy, Check, ChevronDown,
  AlertTriangle, ExternalLink, Users, Briefcase, Laptop, ShoppingBag, TrendingUp,
  X,
} from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api-client";

const CONSENT_COOKIE = "pdpa_tax_ack_v2";
const CONSENT_PENDING = "pdpa_ack_pending";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

// ─── TaxInput — number input card แทน Slider ──────────────────────────────────
function TaxInput({
  label, value, onChange, cap, hint,
  presets, large = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  cap?: number;
  hint?: string;
  presets?: { label: string; value: number }[];
  large?: boolean;
}) {
  const td = useTranslations("tax.deductions");
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const displayVal = focused
    ? raw
    : value > 0 ? value.toLocaleString("th-TH") : "";

  const handleFocus = () => {
    setFocused(true);
    setRaw(value > 0 ? String(value) : "");
  };

  const commit = (str: string) => {
    setFocused(false);
    const num = parseFloat(str.replace(/,/g, ""));
    if (!isNaN(num) && num >= 0) {
      onChange(cap ? Math.min(num, cap) : num);
    } else {
      onChange(0);
    }
  };

  const atCap = cap !== undefined && value >= cap;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 min-h-[20px]">
        <span className={cn("font-medium text-foreground", large ? "text-base" : "text-sm")}>{label}</span>
        {cap && !atCap && value > 0 && (
          <button type="button" onClick={() => onChange(cap)}
            className="text-xs text-primary hover:underline active:opacity-60 shrink-0">
            {td("fullAmount")}
          </button>
        )}
        {atCap && (
          <span className="text-xs text-emerald-600 font-medium shrink-0">{td("atCap")}</span>
        )}
      </div>

      <div className={cn(
        "relative flex items-center gap-2 rounded-xl border transition-all duration-150 bg-card",
        focused
          ? "border-primary ring-2 ring-primary/20 shadow-sm"
          : value > 0 ? "border-border" : "border-border/60",
        large ? "px-4 py-3" : "px-3 py-2.5",
      )}>
        <span className={cn(
          "font-semibold shrink-0 select-none",
          focused ? "text-primary" : "text-muted-foreground",
          large ? "text-xl" : "text-sm",
        )}>฿</span>

        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayVal}
          placeholder="0"
          onFocus={handleFocus}
          onBlur={(e) => commit(e.target.value)}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9.]/g, ""))}
          onKeyDown={(e) => {
            if (e.key === "Enter") { commit(raw); inputRef.current?.blur(); }
            if (e.key === "Escape") { setFocused(false); inputRef.current?.blur(); }
          }}
          className={cn(
            "flex-1 bg-transparent text-right font-bold tabular-nums text-foreground",
            "placeholder:text-muted-foreground/30 outline-none min-w-0",
            large ? "text-2xl" : "text-base",
          )}
        />

        {value > 0 && !focused && (
          <button type="button" onClick={() => onChange(0)}
            className="shrink-0 rounded-full p-0.5 text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted active:scale-90 transition-all">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Preset chips */}
      {presets && presets.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {presets.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => onChange(p.value)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
                value === p.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted/40 text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {p.label}
            </button>
          ))}
          {cap && value !== cap && (
            <button
              type="button"
              onClick={() => onChange(cap)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-all active:scale-95",
                "border-dashed border-muted-foreground/40 text-muted-foreground/60 hover:border-primary/40 hover:text-foreground",
              )}
            >
              Max ฿{cap >= 1_000_000 ? `${cap / 1_000_000}M` : cap >= 1_000 ? `${cap / 1_000}K` : cap}
            </button>
          )}
        </div>
      )}

      {hint && <p className="text-[11px] text-muted-foreground/70 leading-tight">{hint}</p>}
    </div>
  );
}

// ─── Income types (TAX_SPEC §2.1) ─────────────────────────────────────────────
type IncomeType = "salary" | "freelance" | "business" | "affiliate";

const INCOME_TYPES = [
  {
    id: "salary"    as const, icon: Briefcase,   label: "salary",
    subtitle: "salarySubtitle", deductionRate: 0.50, deductionCap: 100_000,
    withholdingRate: null,
    hint: "salaryHint",
  },
  {
    id: "freelance" as const, icon: Laptop,      label: "freelance",
    subtitle: "freelanceSubtitle", deductionRate: 0.60, deductionCap: null,
    withholdingRate: 0.03,
    hint: "freelanceHint",
  },
  {
    id: "business"  as const, icon: ShoppingBag, label: "business",
    subtitle: "businessSubtitle", deductionRate: 0.60, deductionCap: null,
    withholdingRate: 0.00,
    hint: "businessHint",
  },
  {
    id: "affiliate" as const, icon: TrendingUp,  label: "affiliate",
    subtitle: "affiliateSubtitle", deductionRate: 0.30, deductionCap: null,
    withholdingRate: 0.03,
    hint: "affiliateHint",
  },
] as const;

// ─── Tax brackets 2024-2025 (TAX_SPEC §2.2) ───────────────────────────────────
const TAX_BRACKETS = [
  { upTo: 150_000, rate: 0  },
  { upTo: 300_000, rate: 5  },
  { upTo: 500_000, rate: 10 },
  { upTo: 750_000, rate: 15 },
  { upTo: 1_000_000, rate: 20 },
  { upTo: 2_000_000, rate: 25 },
  { upTo: 5_000_000, rate: 30 },
  { upTo: Infinity,  rate: 35 },
];

function calcTax(taxableIncome: number) {
  let tax = 0, prev = 0;
  const breakdown: { from: number; to: number; rate: number; tax: number }[] = [];
  for (const b of TAX_BRACKETS) {
    if (taxableIncome <= prev) break;
    const inBracket = Math.min(taxableIncome, b.upTo) - prev;
    const bracketTax = inBracket * (b.rate / 100);
    tax += bracketTax;
    if (inBracket > 0) breakdown.push({ from: prev, to: Math.min(taxableIncome, b.upTo), rate: b.rate, tax: bracketTax });
    prev = b.upTo;
  }
  return { total: Math.round(tax), breakdown };
}

function getBracketLabel(taxableIncome: number): string {
  for (let i = 0; i < TAX_BRACKETS.length; i++) {
    if (taxableIncome <= TAX_BRACKETS[i].upTo) {
      const b = TAX_BRACKETS[i];
      const prev = i === 0 ? 0 : TAX_BRACKETS[i - 1].upTo;
      if (b.rate === 0) return `0% (≤ ฿${(b.upTo / 1_000).toFixed(0)}K)`;
      return `${b.rate}% (฿${(prev / 1_000).toFixed(0)}K – ฿${b.upTo === Infinity ? "∞" : (b.upTo / 1_000).toFixed(0) + "K"})`;
    }
  }
  return "35%";
}

const DISCLAIMER_KEY = "tax-calc-disclaimer-v1";

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TaxPage() {
  const t = useTranslations("tax");
  const [copySuccess, setCopySuccess]   = useState(false);
  const [disclaimerDone, setDisclaimerDone] = useState(true); // true = hidden until hydration
  const [showFamily, setShowFamily]     = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentLoading, setConsentLoading] = useState(true);
  const [consentError, setConsentError] = useState<string | null>(null);

  // Income
  const [incomeType, setIncomeType]         = useState<IncomeType>("business");
  const [grossIncome, setGrossIncome]       = useState(0);
  const [deductionMethod, setDeductionMethod] = useState<"flat" | "itemized">("flat");
  const [itemizedExpenses, setItemizedExpenses] = useState(0);

  // Family (TAX_SPEC §2.3)
  const [hasSpouse, setHasSpouse]     = useState(false);
  const [numChildren, setNumChildren] = useState(0);
  const [numParents, setNumParents]   = useState(0);

  // Deductions
  const [socialSecurity, setSocialSecurity]       = useState(0);
  const [lifeInsurance, setLifeInsurance]         = useState(0);
  const [pensionInsurance, setPensionInsurance]   = useState(0);
  const [ssf, setSsf]                             = useState(0);
  const [rmf, setRmf]                             = useState(0);
  const [donations, setDonations]                 = useState(0);
  const [otherDeductions, setOtherDeductions]     = useState(0);

  useEffect(() => {
    setDisclaimerDone(!!localStorage.getItem(DISCLAIMER_KEY));
  }, []);

  // PDPA / legal consent (cookie-based via backend)
  useEffect(() => {
    let cancelled = false;
    const localAccepted = readCookie(CONSENT_COOKIE) === "1";
    if (localAccepted) {
      setConsentChecked(true);
      setShowConsentModal(false);
      setConsentLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await apiRequest<{ accepted: boolean }>("/api/consent/pdpa");
        if (cancelled) return;
        setConsentChecked(res.accepted);
        setShowConsentModal(!res.accepted);
        if (res.accepted) {
          writeCookie(CONSENT_COOKIE, "1", 365 * 24 * 60 * 60);
          localStorage.removeItem(CONSENT_PENDING);
        }
      } catch {
        if (cancelled) return;
        // fallback: show modal but allow user to accept locally
        setConsentError("ไม่สามารถตรวจสอบคำยินยอม โปรดลองใหม่");
        setShowConsentModal(true);
      } finally {
        if (!cancelled) setConsentLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const acceptConsent = useCallback(async () => {
    setConsentLoading(true);
    setConsentError(null);
    try {
      await apiRequest("/api/consent/pdpa", { method: "POST" });
      setConsentChecked(true);
      setShowConsentModal(false);
      writeCookie(CONSENT_COOKIE, "1", 365 * 24 * 60 * 60);
      localStorage.removeItem(CONSENT_PENDING);
    } catch {
      // fallback: set client cookie and queue retry
      writeCookie(CONSENT_COOKIE, "1", 365 * 24 * 60 * 60);
      localStorage.setItem(CONSENT_PENDING, "1");
      setConsentChecked(true);
      setShowConsentModal(false);
    } finally {
      setConsentLoading(false);
    }
  }, []);

  // Retry pending consent sync when online
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(CONSENT_PENDING)) return;
    if (!consentChecked) return;
    let cancelled = false;
    (async () => {
      try {
        await apiRequest("/api/consent/pdpa", { method: "POST" });
        if (!cancelled) localStorage.removeItem(CONSENT_PENDING);
      } catch {
        /* keep pending */
      }
    })();
    return () => { cancelled = true; };
  }, [consentChecked]);

  const dismissDisclaimer = () => {
    localStorage.setItem(DISCLAIMER_KEY, "1");
    setDisclaimerDone(true);
  };

  const config = INCOME_TYPES.find((c) => c.id === incomeType)!;

  // ─── Core calculation ────────────────────────────────────────────────────────
  const result = useMemo(() => {
    // Expense deduction (TAX_SPEC §2.1)
    const flatExpenseDeduction =
      incomeType === "salary"
        ? Math.min(grossIncome * 0.50, 100_000)
        : grossIncome * config.deductionRate;
    const expenseDeduction =
      deductionMethod === "flat"
        ? flatExpenseDeduction
        : Math.min(itemizedExpenses, grossIncome);

    const assessableIncome = Math.max(grossIncome - expenseDeduction, 0);

    // Personal allowances (TAX_SPEC §2.3)
    const spouseDeduction   = hasSpouse ? 60_000 : 0;
    const childrenDeduction = numChildren * 30_000;
    const parentsDeduction  = numParents  * 30_000;
    const socialSecurityAmt = incomeType === "salary" ? Math.min(socialSecurity, 9_000) : 0;
    const lifeInsCapped     = Math.min(lifeInsurance,    100_000);
    const pensionInsCapped  = Math.min(pensionInsurance, 200_000);

    // SSF+RMF: each capped individually, then combined capped at 30% assessable
    const ssfCapped = Math.min(ssf, 200_000);
    const rmfCapped = Math.min(rmf, 500_000);
    const maxProvident = assessableIncome * 0.30;
    const combinedProvident = Math.min(ssfCapped + rmfCapped, maxProvident);

    // Donations capped at 10% of assessable income
    const maxDonations   = assessableIncome * 0.10;
    const donationsCapped = Math.min(donations, maxDonations);

    const totalPersonalAllowances =
      60_000 + spouseDeduction + childrenDeduction + parentsDeduction +
      socialSecurityAmt + lifeInsCapped + pensionInsCapped + combinedProvident + donationsCapped + otherDeductions;
    const totalAllowances = expenseDeduction + totalPersonalAllowances;
    const taxableIncome   = Math.max(grossIncome - totalAllowances, 0);
    const taxResult       = calcTax(taxableIncome);

    // Withholding (TAX_SPEC §2.1)
    let withholdingTax: number;
    if (incomeType === "salary") {
      withholdingTax = taxResult.total; // employer withholds full amount
    } else if (config.withholdingRate !== null) {
      withholdingTax = grossIncome * config.withholdingRate;
    } else {
      withholdingTax = 0;
    }

    const netTaxPayable = taxResult.total - withholdingTax;
    const isRefund      = netTaxPayable < 0;

    return {
      grossIncome, assessableIncome, expenseDeduction, flatExpenseDeduction,
      spouseDeduction, childrenDeduction, parentsDeduction,
      socialSecurityAmt, lifeInsCapped, pensionInsCapped, combinedProvident, donationsCapped,
      totalPersonalAllowances, totalAllowances, taxableIncome,
      estimatedTax: taxResult.total, taxBreakdown: taxResult.breakdown,
      withholdingTax, netTaxDue: Math.max(netTaxPayable, 0),
      isRefund, refundAmount: Math.abs(Math.min(netTaxPayable, 0)),
      effectiveRate: grossIncome > 0 ? (taxResult.total / grossIncome) * 100 : 0,
      usingFlat: deductionMethod === "flat",
      bracketLabel: getBracketLabel(taxableIncome),
      // Warnings & flags
      showVatWarning:  incomeType === "business" && grossIncome > 1_800_000,
      ssfRmfExceeded:  (ssfCapped + rmfCapped) > maxProvident && maxProvident > 0,
      donationExceeded: donations > maxDonations && maxDonations > 0,
      deductionFlatLabel:
        incomeType === "salary"    ? t("flatSalary")
        : incomeType === "affiliate" ? t("flatAffiliate")
        : t("flatBusiness"),
    };
  }, [
    incomeType, config, grossIncome, deductionMethod, itemizedExpenses,
    hasSpouse, numChildren, numParents,
    socialSecurity, lifeInsurance, pensionInsurance, ssf, rmf, donations, otherDeductions,
  ]);

  // ─── CPA recommendations (TAX_SPEC §2.4) ────────────────────────────────────
  const cpaRecs = useMemo(() => {
    const recs: string[] = [];
    if (grossIncome > 10_000_000) recs.push(t("cpa.highIncome"));
    if (result.showVatWarning)    recs.push(t("cpa.vatRequired"));
    return recs;
  }, [grossIncome, result.showVatWarning, t]);

  const handleCopySummary = useCallback(async () => {
    const lines = [
      t("title"),
      `${t("incomeTypes.title")}: ${t(`incomeTypes.${config.label}`)}`,
      `${t("summaryGross")}: ${formatCurrency(result.grossIncome)}`,
      `${t("summaryTaxable")}: ${formatCurrency(result.taxableIncome)}`,
      result.isRefund
        ? `${t("refundLabel")}: ${formatCurrency(result.refundAmount)}`
        : `${t("summaryTaxDue")}: ${formatCurrency(result.netTaxDue)}`,
      `${t("effectiveRate")}: ${result.effectiveRate.toFixed(2)}%`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch { setCopySuccess(false); }
  }, [t, result, config.label]);

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border shadow-xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-foreground">{t("consent.title")}</h2>
                <p className="text-sm text-muted-foreground">
                  {t("consent.description")}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t("consent.pdpa")}
                </p>
                {consentError && <p className="text-xs text-red-600">{consentError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                onClick={acceptConsent}
                disabled={consentLoading}
              >
                {consentLoading ? t("consent.saving") : t("consent.accept")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Disclaimer banner (TAX_SPEC §2.4) ──────────────────────────────── */}
      {!disclaimerDone && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">{t("disclaimer.title")}</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-1 leading-relaxed"
                 dangerouslySetInnerHTML={{ __html: t("disclaimer.description") }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.rd.go.th/26237.html"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 hover:underline"
            >
              <ExternalLink className="h-3 w-3" /> {t("disclaimer.officialLink")}
            </a>
            <button
              onClick={dismissDisclaimer}
              className="ml-auto text-xs bg-amber-700 dark:bg-amber-600 text-white rounded-lg px-4 py-1.5 hover:bg-amber-800 active:scale-95 transition-all min-h-[36px]"
            >
              {t("disclaimer.acknowledge")}
            </button>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
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

      {/* ── Income type selector ─────────────────────────────────────────────── */}
      <div className="card space-y-3">
        <p className="text-sm font-semibold text-foreground">{t("incomeTypes.title")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INCOME_TYPES.map((type) => {
            const Icon = type.icon;
            const active = incomeType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => setIncomeType(type.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all active:scale-95 min-h-[80px]",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium leading-tight">{t(`incomeTypes.${type.label}`)}</span>
                <span className="text-[10px] opacity-60">{t(`incomeTypes.${type.subtitle}`)}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2">{t(`incomeTypes.${config.hint}`)}</p>
      </div>

      {/* ── VAT Warning (TAX_SPEC §2.1 business) ───────────────────────────── */}
      {result.showVatWarning && (
        <div className="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/30 px-4 py-3 flex items-start gap-2 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200">{t("vatWarning.title")}</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{t("vatWarning.description")}</p>
            <a
              href="https://www.rd.go.th/7058.html"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-700 dark:text-red-300 hover:underline mt-1"
            >
              <ExternalLink className="h-3 w-3" /> {t("vatWarning.link")}
            </a>
          </div>
        </div>
      )}

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
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

      {/* ── Summary KPI cards ────────────────────────────────────────────────── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {([
          { title: t("summaryGross"),       value: formatCurrency(result.grossIncome),      icon: Receipt },
          { title: t("summaryDeductions"),  value: formatCurrency(result.totalAllowances),  icon: PiggyBank },
          { title: t("summaryTaxable"),     value: formatCurrency(result.taxableIncome),    icon: Calculator },
          {
            title: result.isRefund ? t("summaryRefund") : t("summaryTaxDue"),
            value: result.isRefund ? formatCurrency(result.refundAmount) : formatCurrency(result.netTaxDue),
            icon: FileText,
            cls: result.isRefund ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
          },
        ] as { title: string; value: string; icon: typeof Receipt; cls?: string }[]).map(({ title, value, icon: Icon, cls }) => (
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

      {/* ── Input + Result ───────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Input panel */}
        <div className="card space-y-5">
          <div>
            <h3 className="font-semibold text-foreground">{t("inputTitle")}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{t("inputSubtitle")}</p>
          </div>

          <TaxInput
            label={t("incomeLabel")}
            value={grossIncome}
            onChange={setGrossIncome}
            large
            hint="กรอกรายได้รวมทั้งปีก่อนหักค่าใช้จ่าย"
          />

          {/* Expense method */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t("deductionMethod")}</label>
            <div className="flex gap-2">
              {(["flat", "itemized"] as const).map((m) => (
                <button
                  key={m} type="button"
                  onClick={() => setDeductionMethod(m)}
                  className={cn(
                    "flex-1 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all active:scale-95 min-h-[44px]",
                    deductionMethod === m
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border hover:bg-muted text-foreground"
                  )}
                >
                  {m === "flat" ? result.deductionFlatLabel : t("deductionItemized")}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-1.5">
              {deductionMethod === "flat"
                ? `หักได้ = ${formatCurrency(result.flatExpenseDeduction)}`
                : `ระบุค่าใช้จ่ายจริง = ${formatCurrency(itemizedExpenses)}`}
            </p>
          </div>

          {deductionMethod === "itemized" && (
            <TaxInput
              label={t("itemizedLabel")}
              value={itemizedExpenses}
              onChange={setItemizedExpenses}
              hint={t("deductions.itemizedHint")}
            />
          )}

          {/* ── Family allowances (collapsible) ─────────────────────────────── */}
          <div className="border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFamily((f) => !f)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/50 transition-colors min-h-[48px]"
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                {t("family.title")}
                {(hasSpouse || numChildren > 0 || numParents > 0) && (
                  <span className="rounded-full bg-primary/10 text-primary text-xs px-2 py-0.5">
                    −{formatCurrency((hasSpouse ? 60_000 : 0) + numChildren * 30_000 + numParents * 30_000)}
                  </span>
                )}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showFamily && "rotate-180")} />
            </button>

            {showFamily && (
              <div className="px-4 pb-4 space-y-4 border-t border-border">
                {/* Spouse */}
                <label className="flex items-center gap-3 pt-3 cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox" checked={hasSpouse}
                    onChange={(e) => setHasSpouse(e.target.checked)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  <span className="text-sm text-foreground">
                    {t("family.spouse")}
                    <span className="text-muted-foreground text-xs ml-1.5">{t("family.spouseAmount")}</span>
                  </span>
                </label>

                {/* Children */}
                <div className="flex items-center gap-3 min-h-[44px]">
                  <span className="text-sm text-foreground flex-1">
                    {t("family.children")} <span className="text-muted-foreground text-xs">{t("family.childrenPer")}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setNumChildren((c) => Math.max(0, c - 1))}
                      className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95 transition-all text-sm">−</button>
                    <span className="w-6 text-center tabular-nums text-sm font-semibold">{numChildren}</span>
                    <button type="button" onClick={() => setNumChildren((c) => Math.min(20, c + 1))}
                      className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95 transition-all text-sm">+</button>
                  </div>
                </div>

                {/* Parents */}
                <div className="flex items-center gap-3 min-h-[44px]">
                  <span className="text-sm text-foreground flex-1">
                    {t("family.parents")} <span className="text-muted-foreground text-xs">{t("family.parentsPer")}</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setNumParents((n) => Math.max(0, n - 1))}
                      className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95 transition-all text-sm">−</button>
                    <span className="w-6 text-center tabular-nums text-sm font-semibold">{numParents}</span>
                    <button type="button" onClick={() => setNumParents((n) => Math.min(4, n + 1))}
                      className="h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted active:scale-95 transition-all text-sm">+</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Other deductions ─────────────────────────────────────────────── */}
          <div className="border-t border-border pt-4 space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground">{t("allowancesTitle")}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{t("personalFixed")}: {formatCurrency(60_000)}</p>
            </div>

            {incomeType === "salary" && (
              <TaxInput
                label={t("socialSecurity")}
                value={socialSecurity}
                onChange={setSocialSecurity}
                cap={9_000}
                presets={[{ label: "฿9,000 (max)", value: 9_000 }]}
                hint={t("deductions.socialSecurityHint")}
              />
            )}

            <TaxInput
              label={t("lifeInsurance")}
              value={lifeInsurance}
              onChange={setLifeInsurance}
              cap={100_000}
              presets={[
                { label: "฿50,000", value: 50_000 },
                { label: "฿100,000 (max)", value: 100_000 },
              ]}
              hint="เบี้ยประกันชีวิต สูงสุด ฿100,000/ปี"
            />

            <TaxInput
              label={t("deductions.pensionInsurance")}
              value={pensionInsurance}
              onChange={setPensionInsurance}
              cap={200_000}
              presets={[
                { label: "฿100,000", value: 100_000 },
                { label: "฿200,000 (max)", value: 200_000 },
              ]}
              hint={t("deductions.pensionHint")}
            />

            <div className="space-y-1">
              <TaxInput
                label={t("deductions.ssfLabel")}
                value={ssf}
                onChange={setSsf}
                cap={200_000}
                presets={[
                  { label: "฿100,000", value: 100_000 },
                  { label: "฿200,000 (max)", value: 200_000 },
                ]}
                hint={t("deductions.ssfHint")}
              />
              {ssf > 0 && ssf > result.assessableIncome * 0.30 && result.assessableIncome > 0 && (
                <p className="text-xs text-red-600 px-1">{t("deductions.ssfOver30", { amount: formatCurrency(result.assessableIncome * 0.30) })}</p>
              )}
            </div>

            <div className="space-y-1">
              <TaxInput
                label={t("deductions.rmfLabel")}
                value={rmf}
                onChange={setRmf}
                cap={500_000}
                presets={[
                  { label: "฿100,000", value: 100_000 },
                  { label: "฿500,000 (max)", value: 500_000 },
                ]}
                hint={t("deductions.rmfHint")}
              />
              {result.ssfRmfExceeded && (
                <p className="text-xs text-amber-600 px-1">
                  {t("deductions.ssfRmfOver30", { amount: formatCurrency(result.assessableIncome * 0.30) })}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <TaxInput
                label={t("donations")}
                value={donations}
                onChange={setDonations}
                hint={t("deductions.donationHint")}
              />
              {result.donationExceeded && (
                <p className="text-xs text-amber-600 px-1">{t("deductions.donationOver10", { amount: formatCurrency(result.assessableIncome * 0.10) })}</p>
              )}
            </div>

            <TaxInput
              label={t("otherAllowances")}
              value={otherDeductions}
              onChange={setOtherDeductions}
              hint={t("deductions.otherHint")}
            />
          </div>
        </div>

        {/* Result panel */}
        <div className="space-y-4">
          <div className="card space-y-1.5 text-sm">
            <div className="mb-3">
              <h3 className="font-semibold text-foreground">{t("resultTitle")}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{t("resultSubtitle")}</p>
            </div>

            {([
              { l: t("summaryGross"),          v: formatCurrency(result.grossIncome),      cls: "font-medium" },
              { l: result.usingFlat ? result.deductionFlatLabel : t("deductionItemized"), v: `−${formatCurrency(result.expenseDeduction)}`, cls: "text-muted-foreground" },
              { l: t("personalFixed"),          v: `−${formatCurrency(60_000)}`,            cls: "text-muted-foreground" },
              result.spouseDeduction   > 0 ? { l: t("result.spouseLabel"),                v: `−${formatCurrency(result.spouseDeduction)}`,   cls: "text-muted-foreground" } : null,
              result.childrenDeduction > 0 ? { l: t("result.childrenLabel", { count: numChildren }),v: `−${formatCurrency(result.childrenDeduction)}`, cls: "text-muted-foreground" } : null,
              result.parentsDeduction  > 0 ? { l: t("result.parentsLabel", { count: numParents }),v: `−${formatCurrency(result.parentsDeduction)}`, cls: "text-muted-foreground" } : null,
              result.socialSecurityAmt > 0 ? { l: t("socialSecurity"),       v: `−${formatCurrency(result.socialSecurityAmt)}`, cls: "text-muted-foreground" } : null,
              result.lifeInsCapped     > 0 ? { l: t("lifeInsurance"),         v: `−${formatCurrency(result.lifeInsCapped)}`,    cls: "text-muted-foreground" } : null,
              result.pensionInsCapped  > 0 ? { l: t("result.pensionLabel"),            v: `−${formatCurrency(result.pensionInsCapped)}`,  cls: "text-muted-foreground" } : null,
              result.combinedProvident > 0 ? { l: t("result.ssfRmfLabel"),               v: `−${formatCurrency(result.combinedProvident)}`, cls: "text-muted-foreground" } : null,
              result.donationsCapped   > 0 ? { l: t("donations"),             v: `−${formatCurrency(result.donationsCapped)}`,  cls: "text-muted-foreground" } : null,
              otherDeductions          > 0 ? { l: t("otherAllowances"),       v: `−${formatCurrency(otherDeductions)}`,          cls: "text-muted-foreground" } : null,
            ].filter(Boolean) as { l: string; v: string; cls: string }[])
              .map((row) => (
                <div key={row.l} className={cn("flex justify-between py-1 border-b border-border/50", row.cls)}>
                  <span>{row.l}</span><span>{row.v}</span>
                </div>
              ))}

            <div className="flex justify-between py-2 border-t font-medium">
              <span>{t("summaryTaxable")}</span>
              <span className="tabular-nums">{formatCurrency(result.taxableIncome)}</span>
            </div>
            <div className="flex justify-between py-2 border-t font-bold">
              <span>{t("summaryTaxDue")}</span>
              <span className="text-red-600 dark:text-red-400 tabular-nums">{formatCurrency(result.estimatedTax)}</span>
            </div>
            <div className="flex justify-between py-1 text-muted-foreground">
              <span>
                {incomeType === "salary"   ? t("result.withholdingEmployer")
                : incomeType === "business" ? t("result.withholdingZero")
                : t("result.withholding3pct")}
              </span>
              <span className="tabular-nums">−{formatCurrency(result.withholdingTax)}</span>
            </div>
            <div className="flex justify-between py-3 border-t-2 border-foreground/20">
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

            <div className="flex justify-between pt-1 text-muted-foreground text-xs border-t border-border/50">
              <span>{t("effectiveRate")}</span>
              <span className="font-medium tabular-nums">{result.effectiveRate.toFixed(2)}%</span>
            </div>
          </div>

          {/* CPA recommendations */}
          {cpaRecs.length > 0 && (
            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 p-3 space-y-1.5">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-200">{t("cpa.title")}</p>
              {cpaRecs.map((r, i) => (
                <p key={i} className="text-xs text-blue-700 dark:text-blue-300">• {r}</p>
              ))}
              <a href="https://www.fap.or.th/" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-blue-700 dark:text-blue-300 hover:underline mt-1">
                <ExternalLink className="h-3 w-3" /> {t("cpa.fapLink")}
              </a>
            </div>
          )}

          {/* Tips */}
          <div className="card space-y-2 text-sm">
            <h4 className="font-semibold text-foreground">{t("tipsTitle")}</h4>
            {(ssf + rmf) < 200_000 && grossIncome > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("tipsSsfRmf")} เพิ่ม SSF/RMF ได้อีก{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(Math.min(200_000 - ssf - rmf, Math.max(0, result.assessableIncome * 0.30 - ssf - rmf)))}
                </span>
              </p>
            )}
            {lifeInsurance < 100_000 && (
              <p className="text-xs text-muted-foreground">{t("tipsLifeInsurance")}</p>
            )}
            {pensionInsurance < 200_000 && grossIncome > 500_000 && (
              <p className="text-xs text-muted-foreground">
                {t("pensionTip", { amount: formatCurrency(200_000 - pensionInsurance) })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Tax bracket breakdown (collapsible) ─────────────────────────────── */}
      <details className="group/tax card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-2 px-3 font-semibold text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open/tax:rotate-180" />
          <span>{t("detailBreakdown")}</span>
        </summary>
        <div className="pt-2 pb-1">
          {result.taxBreakdown.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left py-1.5 px-2 font-medium">{t("bracket.netIncome")}</th>
                    <th className="text-center py-1.5 px-2 font-medium">{t("bracket.rate")}</th>
                    <th className="text-right py-1.5 px-2 font-medium">{t("bracket.tax")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.taxBreakdown.map((b, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-1.5 px-2">{b.from.toLocaleString()} – {b.to === Infinity ? "…" : b.to.toLocaleString()}</td>
                      <td className="py-1.5 px-2 text-center">{b.rate === 0 ? "0" : `${b.rate}%`}</td>
                      <td className="py-1.5 px-2 text-right tabular-nums">{formatCurrency(b.tax)}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-border bg-muted/50 font-medium">
                    <td className="py-1.5 px-2" colSpan={2}>{t("bracket.totalTax")}</td>
                    <td className="py-1.5 px-2 text-right tabular-nums">{formatCurrency(result.estimatedTax)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t("bracket.enterIncome")}</p>
          )}
        </div>
      </details>

      {/* ── Full rate table (collapsible) ────────────────────────────────────── */}
      <details className="group/tax2 card overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg py-2 px-3 font-semibold text-foreground hover:bg-muted/50 transition-colors [&::-webkit-details-marker]:hidden">
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open/tax2:rotate-180" />
          <span>{t("detailRates")}</span>
        </summary>
        <div className="pt-2 pb-1">
          <p className="text-sm text-muted-foreground mb-3">{t("bracketSubtitle")}</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="text-left py-2 px-3 font-medium">{t("bracket.netIncome")}</th>
                  <th className="text-center py-2 px-3 font-medium">{t("bracket.rate")}</th>
                  <th className="text-right py-2 px-3 font-medium">{t("bracket.maxTaxInBracket")}</th>
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
                        {bracket.upTo === Infinity ? "∞" : bracket.upTo.toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-center font-medium">
                        {bracket.rate === 0 ? "0%" : `${bracket.rate}%`}
                      </td>
                      <td className="py-2 px-3 text-right tabular-nums">
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

      {/* ── External links + Legal footer (TAX_SPEC §2.4) ───────────────────── */}
      <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t("links.title")}</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: t("links.rdCalc"), href: "https://www.rd.go.th/26237.html" },
            { label: t("links.eFiling"), href: "https://efiling.rd.go.th/rd-cms/" },
            { label: t("links.fap"),  href: "https://www.fap.or.th/" },
            { label: t("links.vatReg"),              href: "https://www.rd.go.th/7058.html" },
          ].map(({ label, href }) => (
            <a
              key={href} href={href} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95 min-h-[44px]"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />{label}
            </a>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground/60 pt-1 border-t border-border/50">
          {t("links.footer")}
        </p>
      </div>

    </div>
  );
}
