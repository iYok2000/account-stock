"use client";

import { ArrowRight, Lightbulb, TrendingUp, Users } from "lucide-react";

export default function FunnelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">UPSYD Funnel</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          วิเคราะห์ marketing funnel ตาม UPSYD model (Unaware → Problem → Solution → Your solution → Deal)
        </p>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — ข้อมูล funnel จริงจะแสดงเมื่อเชื่อมต่อ backend</span>
      </div>

      {/* Summary — empty until API */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          { icon: TrendingUp, iconBg: "bg-green-100", iconColor: "text-green-600", label: "รายรับจาก Funnel", value: "—" },
          { icon: Users, iconBg: "bg-primary/10", iconColor: "text-primary", label: "Overall Conversion", value: "—" },
          { icon: ArrowRight, iconBg: "bg-secondary/30", iconColor: "text-secondary-foreground", label: "Avg. Journey Time", value: "—" },
        ].map(({ icon: Icon, iconBg, iconColor, label, value }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
              <Icon className={`h-6 w-6 ${iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Funnel list — empty state */}
      <div className="card text-center py-12 text-muted-foreground">
        <p className="font-medium text-foreground">ไม่มีข้อมูล Funnel</p>
        <p className="text-sm mt-1">รอต่อ API — การแสดงผล funnel จะใช้งานได้เมื่อเชื่อมต่อ backend</p>
      </div>

      {/* Static help: stage names (no mock numbers) */}
      <div className="card border-primary/20 bg-primary/5">
        <h3 className="font-semibold flex items-center gap-2 text-foreground">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          UPSYD Stages (อ้างอิง)
        </h3>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><strong className="text-foreground">U — Unaware:</strong> ยังไม่รู้จักแบรนด์/สินค้า</li>
          <li><strong className="text-foreground">P — Problem-Aware:</strong> รู้ว่ามีปัญหาแต่ยังไม่รู้ทางแก้</li>
          <li><strong className="text-foreground">S — Solution-Aware:</strong> รู้ว่ามีทางแก้แต่ยังไม่รู้จักสินค้าเรา</li>
          <li><strong className="text-foreground">Y — Your Solution:</strong> รู้จักสินค้าเรา กำลังพิจารณา</li>
          <li><strong className="text-foreground">D — Deal:</strong> พร้อมซื้อ ต้องการ offer/deal</li>
        </ul>
      </div>
    </div>
  );
}
