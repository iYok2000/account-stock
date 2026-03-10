"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/utils";
import { FEE, CATEGORY_RATES, type SliderKey } from "@/lib/calculator/engine";
import { cn } from "@/lib/utils";

interface Props {
  listPrice: number; setListPrice: (v: number) => void;
  sellingPrice: number; setSellingPrice: (v: number) => void;
  productCost: number; setProductCost: (v: number) => void;
  quantity: number; setQuantity: (v: number) => void;
  shippingCost: number; setShippingCost: (v: number) => void;
  affiliateRate: number; setAffiliateRate: (v: number) => void;
  adSpend: number; setAdSpend: (v: number) => void;
  packagingCost: number; setPackagingCost: (v: number) => void;
  returnRate: number; setReturnRate: (v: number) => void;
  lockedSliders: Set<SliderKey>;
  toggleLock: (k: SliderKey) => void;
  priceMode: "list" | "selling";
  discountPct: number;
  /** When true, hide advanced inputs: packaging, adSpend, returnRate */
  simpleMode?: boolean;
}

function Group({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function SlidersPanel(p: Props) {
  const t = useTranslations("calculator.sliders");
  const tGroups = useTranslations("calculator");
  const locked = (k: SliderKey) => p.lockedSliders.has(k);
  const simple = p.simpleMode ?? false;

  return (
    <div className="card space-y-6">
      <div>
        <h3 className="font-semibold text-foreground">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <Group title={tGroups("groupPricing")}>
        <Slider label={t("listPrice")}    value={p.listPrice}    onChange={p.setListPrice}    min={0} max={50_000} step={50}  prefix="฿" />
        <Slider label={t("sellingPrice")} value={p.sellingPrice} onChange={p.setSellingPrice} min={0} max={50_000} step={50}  prefix="฿" />
        {p.discountPct > 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950/30 dark:text-orange-400 rounded px-2 py-1.5">
            {t("discountNote", { pct: p.discountPct.toFixed(0), saving: formatCurrency(p.listPrice - p.sellingPrice) })}
          </div>
        )}
      </Group>

      <Group title={tGroups("groupCosts")}>
        <Slider label={t("productCost")}  value={p.productCost}  onChange={p.setProductCost}  min={0} max={50_000} step={50}  prefix="฿" showLock locked={locked("productCost")}  onLockToggle={() => p.toggleLock("productCost")} hint={t("hintProductCost")} />
        <Slider label={t("quantity")}     value={p.quantity}     onChange={p.setQuantity}     min={1} max={500_000} step={100} suffix={t("unit")} />
        <Slider label={t("shippingCost")} value={p.shippingCost} onChange={p.setShippingCost} min={0} max={500}    step={5}   prefix="฿" showLock locked={locked("shippingCost")}  onLockToggle={() => p.toggleLock("shippingCost")} hint={t("hintShipping")} />
        {!simple && (
          <Slider label={t("packagingCost")} value={p.packagingCost} onChange={p.setPackagingCost} min={0} max={500} step={5} prefix="฿" showLock locked={locked("packagingCost")} onLockToggle={() => p.toggleLock("packagingCost")} hint={t("hintPackaging")} />
        )}
      </Group>

      <Group title={tGroups("groupMarketing")}>
        <Slider label={t("affiliateRate")} value={p.affiliateRate} onChange={p.setAffiliateRate} min={0} max={30} step={0.5} suffix="%" showLock locked={locked("affiliateRate")} onLockToggle={() => p.toggleLock("affiliateRate")} hint={t("hintAffiliate")} />
        {!simple && (
          <Slider label={t("adSpend")} value={p.adSpend} onChange={p.setAdSpend} min={0} max={1_000} step={10} prefix="฿" showLock locked={locked("adSpend")} onLockToggle={() => p.toggleLock("adSpend")} hint={t("hintAdSpend")} />
        )}
      </Group>

      {!simple && (
        <Group title={tGroups("groupReturns")}>
          <Slider label={t("returnRate")} value={p.returnRate} onChange={p.setReturnRate} min={0} max={50} step={0.5} suffix="%" showLock locked={locked("returnRate")} onLockToggle={() => p.toggleLock("returnRate")} hint={t("hintReturnRate")} />
        </Group>
      )}

      <div className="pt-1 flex items-start gap-2 text-xs text-muted-foreground border-t border-border">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          {t("feeNote", {
            c:    (FEE.COMMISSION      * 100).toFixed(1),
            cgf:  (FEE.COMMERCE_GROWTH * 100).toFixed(1),
            infra:(FEE.INFRASTRUCTURE  * 100).toFixed(2),
            pay:  (FEE.PAYMENT         * 100).toFixed(2),
            v:    (FEE.VAT             * 100).toFixed(1),
            mode: p.priceMode === "list" ? t("feeNoteList") : t("feeNoteSelling"),
          })}
          <span className="ml-2 inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">General</span>
        </span>
      </div>
      <div className="flex items-start gap-2 text-[10px] text-muted-foreground/70">
        <Info className="h-2.5 w-2.5 shrink-0 mt-0.5" />
        <span>
          Beauty: Commission {(CATEGORY_RATES.beauty.commission * 100).toFixed(1)}% + CGF {(CATEGORY_RATES.beauty.commerceGrowth * 100).toFixed(1)}%
          {" · "}Food: Commission {(CATEGORY_RATES.food.commission * 100).toFixed(1)}% + CGF {(CATEGORY_RATES.food.commerceGrowth * 100).toFixed(1)}%
        </span>
      </div>
    </div>
  );
}
