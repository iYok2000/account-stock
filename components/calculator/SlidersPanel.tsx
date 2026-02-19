"use client";

import { useTranslations } from "next-intl";
import { Info } from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatCurrency } from "@/lib/utils";
import { FEE, type SliderKey } from "@/lib/calculator/engine";

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
}

export function SlidersPanel(p: Props) {
  const t = useTranslations("calculator.sliders");
  const locked = (k: SliderKey) => p.lockedSliders.has(k);

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="font-semibold text-foreground">{t("title")}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <Slider label={t("listPrice")}    value={p.listPrice}    onChange={p.setListPrice}    min={0} max={50_000} step={50}  prefix="฿" />
      <Slider label={t("sellingPrice")} value={p.sellingPrice} onChange={p.setSellingPrice} min={0} max={50_000} step={50}  prefix="฿" />

      {p.discountPct > 0 && (
        <div className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1.5">
          {t("discountNote", { pct: p.discountPct.toFixed(0), saving: formatCurrency(p.listPrice - p.sellingPrice) })}
        </div>
      )}

      <Slider label={t("productCost")}  value={p.productCost}  onChange={p.setProductCost}  min={0} max={50_000} step={50}  prefix="฿" showLock locked={locked("productCost")}  onLockToggle={() => p.toggleLock("productCost")} />
      <Slider label={t("quantity")}     value={p.quantity}     onChange={p.setQuantity}     min={1} max={500_000} step={100} suffix={t("unit")} />
      <Slider label={t("shippingCost")} value={p.shippingCost} onChange={p.setShippingCost} min={0} max={500}    step={5}   prefix="฿" showLock locked={locked("shippingCost")}  onLockToggle={() => p.toggleLock("shippingCost")} />
      <Slider label={t("affiliateRate")}value={p.affiliateRate} onChange={p.setAffiliateRate} min={0} max={30}  step={0.5} suffix="%" showLock locked={locked("affiliateRate")} onLockToggle={() => p.toggleLock("affiliateRate")} />
      <Slider label={t("adSpend")}      value={p.adSpend}      onChange={p.setAdSpend}      min={0} max={1_000}  step={10}  prefix="฿" showLock locked={locked("adSpend")}       onLockToggle={() => p.toggleLock("adSpend")} />
      <Slider label={t("packagingCost")}value={p.packagingCost} onChange={p.setPackagingCost} min={0} max={500} step={5}   prefix="฿" showLock locked={locked("packagingCost")} onLockToggle={() => p.toggleLock("packagingCost")} />
      <Slider label={t("returnRate")}   value={p.returnRate}   onChange={p.setReturnRate}   min={0} max={50}    step={0.5} suffix="%" showLock locked={locked("returnRate")}    onLockToggle={() => p.toggleLock("returnRate")} />

      <div className="pt-1 flex items-start gap-2 text-xs text-muted-foreground border-t border-border">
        <Info className="h-3 w-3 shrink-0 mt-0.5" />
        <span>
          {t("feeNote", {
            c: (FEE.COMMISSION * 100).toFixed(1),
            v: (FEE.VAT * 100).toFixed(1),
            pay: (FEE.PAYMENT * 100).toFixed(1),
            mode: p.priceMode === "list" ? t("feeNoteList") : t("feeNoteSelling"),
          })}
          <span className="ml-2 inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px]">Default</span>
        </span>
      </div>
    </div>
  );
}
