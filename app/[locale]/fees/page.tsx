"use client";

import { BadgePercent, Plus, Info, X } from "lucide-react";

type FeeType = "COMMISSION" | "PAYMENT_PROCESSING" | "PLATFORM" | "SHIPPING" | "AFFILIATE" | "OTHER";

const FEE_TYPE_LABELS: Record<FeeType, string> = {
  COMMISSION: "ค่าคอมมิชชั่น",
  PAYMENT_PROCESSING: "ค่าชำระเงิน",
  PLATFORM: "ค่าแพลตฟอร์ม",
  SHIPPING: "ค่าจัดส่ง",
  AFFILIATE: "ค่า Affiliate",
  OTHER: "อื่นๆ",
};

const FEE_TYPE_INFO: Record<FeeType, string> = {
  COMMISSION: "แพลตฟอร์มหักค่าคอมมิชชั่นจากราคาขาย ตามหมวดหมู่สินค้า",
  PAYMENT_PROCESSING: "ค่าธรรมเนียมการชำระเงินผ่านระบบแพลตฟอร์ม",
  PLATFORM: "ค่าบริการแพลตฟอร์มพื้นฐาน (ปกติ 0%)",
  AFFILIATE: "ค่าคอมมิชชั่นที่จ่ายให้ผู้แนะนำ/Affiliate",
  SHIPPING: "ค่าขนส่งที่แพลตฟอร์มเรียกเก็บ",
  OTHER: "ค่าธรรมเนียมอื่นๆ",
};

// Default fee suggestions (read-only reference)
const DEFAULT_FEE_SUGGESTIONS = [
  { type: "COMMISSION" as FeeType, category: "สกินแคร์/แฟชั่น/สุขภาพ", rate: 4 },
  { type: "COMMISSION" as FeeType, category: "อิเล็กทรอนิกส์", rate: 3 },
  { type: "COMMISSION" as FeeType, category: "อาหาร", rate: 2 },
  { type: "PAYMENT_PROCESSING" as FeeType, category: "-", rate: 2 },
  { type: "AFFILIATE" as FeeType, category: "ตามแคมเปญ", rate: 10 },
];

export default function FeesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BadgePercent className="h-7 w-7" />
            จัดการค่าธรรมเนียม
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            กำหนดค่าธรรมเนียมแพลตฟอร์มสำหรับการคำนวณกำไร
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2" disabled>
          <Plus className="h-4 w-4" />
          เพิ่มค่าธรรมเนียม
        </button>
      </div>

      {/* API Placeholder */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — การจัดการค่าธรรมเนียมจะใช้งานได้เมื่อเชื่อมต่อ backend</span>
      </div>

      {/* Fixed fees section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">ค่าธรรมเนียมหลัก</h3>
          <p className="text-sm text-muted-foreground">
            ค่าธรรมเนียมพื้นฐานที่แพลตฟอร์มเรียกเก็บทุกคำสั่งซื้อ
          </p>
        </div>
        <div className="card text-center py-8 text-muted-foreground">
          <p>ยังไม่มีค่าธรรมเนียมหลัก</p>
          <p className="text-xs mt-1">รอต่อ API — คลิก "เพิ่มค่าธรรมเนียม" เมื่อ backend พร้อม</p>
        </div>
      </div>

      {/* Campaign fees section */}
      <div className="space-y-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">ค่าธรรมเนียมแคมเปญ</h3>
          <p className="text-sm text-muted-foreground">
            ค่าธรรมเนียมเสริมที่อาจเกิดขึ้นตามแคมเปญหรือกิจกรรม
          </p>
        </div>
        <div className="card text-center py-8 text-muted-foreground">
          <p>ยังไม่มีค่าธรรมเนียมแคมเปญ</p>
          <p className="text-xs mt-1">ค่าธรรมเนียมเสริมจะแสดงที่นี่</p>
        </div>
      </div>

      {/* Reference info */}
      <div className="card border-primary/20 bg-primary/5">
        <div className="mb-4">
          <h3 className="font-semibold flex items-center gap-2 text-foreground">
            <Info className="h-5 w-5 text-primary" />
            อัตราค่าธรรมเนียมแนะนำ (ตัวอย่าง)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">ประเภท</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">หมวดหมู่</th>
                <th className="text-center py-2 px-3 font-medium text-muted-foreground">อัตรา (%)</th>
                <th className="text-left py-2 px-3 font-medium text-muted-foreground">รายละเอียด</th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_FEE_SUGGESTIONS.map((fee, i) => (
                <tr key={i} className="border-b last:border-0">
                  <td className="py-2 px-3 font-medium">{FEE_TYPE_LABELS[fee.type]}</td>
                  <td className="py-2 px-3 text-muted-foreground">{fee.category}</td>
                  <td className="py-2 px-3 text-center font-bold text-primary">{fee.rate}%</td>
                  <td className="py-2 px-3 text-xs text-muted-foreground">{FEE_TYPE_INFO[fee.type]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground italic mt-3">
          หมายเหตุ: อัตราค่าธรรมเนียมอาจเปลี่ยนแปลงตามนโยบายแพลตฟอร์ม กรุณาตรวจสอบจาก Seller Center
        </p>
      </div>

      {/* Fee type guide */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {(Object.entries(FEE_TYPE_LABELS) as [FeeType, string][]).map(([key, label]) => (
          <div key={key} className="card">
            <div className="flex items-start gap-2">
              <BadgePercent className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{FEE_TYPE_INFO[key]}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
