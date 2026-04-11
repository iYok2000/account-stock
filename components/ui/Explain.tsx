"use client";

import { useState, useRef, useEffect } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Explain — tooltip for jargon terms.
 * Desktop: hover to show. Mobile: tap to toggle.
 * Shows a "per ฿100" style explanation that non-technical users understand.
 */
export function Explain({
  children,
  tip,
  className = "",
}: {
  children: React.ReactNode;
  tip: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  // Close on outside tap (mobile)
  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [open]);

  return (
    <span ref={ref} className={cn("relative inline-flex items-center gap-0.5", className)}>
      <span
        className="border-b border-dashed border-blue-300 cursor-help"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
      >
        {children}
      </span>
      <Info
        className="w-3 h-3 text-blue-400 flex-shrink-0 cursor-help"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      />
      {open && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 sm:w-56 px-3 py-2 bg-blue-800 text-white text-xs rounded-lg shadow-lg leading-relaxed text-center pointer-events-none animate-in fade-in-0 zoom-in-95">
          {tip}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-blue-800" />
        </span>
      )}
    </span>
  );
}

// ============== Preset explanations for common terms ==============

/** อัตรากำไร X% → "ขาย ฿100 เหลือกำไร ฿X" */
export function explainMargin(percent: number): string {
  const perHundred = Math.round(percent);
  if (percent < 0) return `ขาย ฿100 ขาดทุน ฿${Math.abs(perHundred)}`;
  return `ขาย ฿100 เหลือกำไร ฿${perHundred}`;
}

/** ค่าธรรมเนียม X% → "ขาย ฿100 โดนหัก ฿X" */
export function explainFeeRate(percent: number): string {
  const perHundred = Math.round(percent);
  return `ขาย ฿100 โดนหัก ฿${perHundred}`;
}

/** อัตราคืนสินค้า X% → "ขาย 100 ชิ้น คืน X ชิ้น" */
export function explainReturnRate(percent: number): string {
  const per100 = Math.round(percent);
  return `ขาย 100 ชิ้น คืน ${per100} ชิ้น`;
}

/** ต้นทุน X% → "ขาย ฿100 ต้นทุน ฿X" */
export function explainCostRate(percent: number): string {
  const perHundred = Math.round(percent);
  return `ขาย ฿100 ต้นทุน ฿${perHundred}`;
}

/** ส่วนลดเฉลี่ย X% → "สินค้า ฿100 ลดให้ลูกค้า ฿X" */
export function explainDiscountRate(percent: number): string {
  const per100 = Math.round(percent);
  return `สินค้า ฿100 ลดให้ลูกค้า ฿${per100}`;
}

/** ภาระส่วนลด X% → "ส่วนลด ฿100 เราเป็นคนจ่าย ฿X" */
export function explainSellerShare(percent: number): string {
  const per100 = Math.round(percent);
  return `ส่วนลด ฿100 เราเป็นคนจ่าย ฿${per100}`;
}

/** ภาระส่วนลด X% → "ส่วนลด ฿100 TikTok เป็นคนจ่าย ฿X" */
export function explainPlatformShare(percent: number): string {
  const per100 = Math.round(percent);
  return `ส่วนลด ฿100 TikTok เป็นคนจ่าย ฿${per100}`;
}

/** อัตรายกเลิก X% → "สั่ง 100 ออเดอร์ ถูกยกเลิก X ออเดอร์" */
export function explainCancelRate(percent: number): string {
  const per100 = Math.round(percent);
  return `สั่ง 100 ออเดอร์ ถูกยกเลิก ${per100} ออเดอร์`;
}

/** YoY (Year-over-Year) → "เปรียบเทียบกับช่วงเดียวกันปีที่แล้ว" */
export function explainYoY(): string {
  return "เปรียบเทียบกับช่วงเดียวกันของปีที่แล้ว เช่น ม.ค. ปีนี้ vs ม.ค. ปีที่แล้ว";
}

/** COD (Cash on Delivery) → "เก็บเงินปลายทาง" */
export function explainCOD(): string {
  return "เก็บเงินปลายทาง = ลูกค้าจ่ายเงินเมื่อได้รับสินค้า ไม่ต้องจ่ายล่วงหน้า";
}
