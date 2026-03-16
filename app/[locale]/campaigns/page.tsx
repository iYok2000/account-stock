"use client";

import { Plus, TrendingUp, DollarSign, MousePointerClick, Eye } from "lucide-react";

export default function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">แคมเปญ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            จัดการและวิเคราะห์แคมเปญโปรโมชั่น
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start" disabled>
          <Plus className="h-4 w-4" />
          สร้างแคมเปญ
        </button>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — ข้อมูลแคมเปญจริงจะแสดงเมื่อเชื่อมต่อ backend</span>
      </div>

      {/* Summary Stats — empty until API */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "ค่าโฆษณารวม", value: "—", icon: DollarSign },
          { title: "รายรับจากแคมเปญ", value: "—", icon: TrendingUp },
          { title: "ROAS เฉลี่ย", value: "—", icon: MousePointerClick },
          { title: "Conversions", value: "—", icon: Eye },
        ].map(({ title, value, icon: Icon }) => (
          <div key={title} className="card flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{title}</p>
              <p className="text-lg font-bold text-foreground">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Campaign list — empty state */}
      <div className="card text-center py-12 text-muted-foreground">
        <p className="font-medium text-foreground">ไม่มีข้อมูลแคมเปญ</p>
        <p className="text-sm mt-1">รอต่อ API — รายการแคมเปญจะแสดงเมื่อเชื่อมต่อ backend</p>
      </div>
    </div>
  );
}
