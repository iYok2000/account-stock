"use client";

import { Plus, TrendingUp, DollarSign, MousePointerClick, Eye } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const DEMO_CAMPAIGNS = [
  {
    id: "1",
    name: "โปรโมชั่นลดราคาพิเศษ",
    type: "FLASH_SALE",
    status: "ACTIVE",
    budget: 5000,
    spend: 3420,
    impressions: 45200,
    clicks: 1280,
    conversions: 67,
    revenue: 19430,
    roas: 5.68,
    ctr: 2.83,
    startDate: "1 มี.ค. 2568",
    endDate: "31 มี.ค. 2568",
  },
  {
    id: "2",
    name: "แคมเปญ Affiliate พันธมิตร",
    type: "AFFILIATE",
    status: "ACTIVE",
    budget: 3000,
    spend: 1850,
    impressions: 32100,
    clicks: 890,
    conversions: 42,
    revenue: 12558,
    roas: 6.79,
    ctr: 2.77,
    startDate: "1 มี.ค. 2568",
    endDate: "31 มี.ค. 2568",
  },
  {
    id: "3",
    name: "โค้ดส่วนลดสำหรับลูกค้าเก่า",
    type: "VOUCHER",
    status: "ACTIVE",
    budget: 2000,
    spend: 980,
    impressions: 18500,
    clicks: 620,
    conversions: 28,
    revenue: 8372,
    roas: 8.54,
    ctr: 3.35,
    startDate: "1 มี.ค. 2568",
    endDate: "31 มี.ค. 2568",
  },
  {
    id: "4",
    name: "โปร Bundle ซื้อคู่ลดพิเศษ",
    type: "BUNDLE_DEAL",
    status: "COMPLETED",
    budget: 1000,
    spend: 1000,
    impressions: 12800,
    clicks: 450,
    conversions: 35,
    revenue: 15750,
    roas: 15.75,
    ctr: 3.52,
    startDate: "15 ก.พ. 2568",
    endDate: "28 ก.พ. 2568",
  },
];

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  ACTIVE: {
    label: "กำลังทำงาน",
    cls: "inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700",
  },
  COMPLETED: {
    label: "เสร็จสิ้น",
    cls: "inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
  },
  PAUSED: {
    label: "หยุดชั่วคราว",
    cls: "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700",
  },
};

const TYPE_MAP: Record<string, string> = {
  FLASH_SALE: "Flash Sale",
  AFFILIATE: "Affiliate",
  VOUCHER: "Voucher",
  BUNDLE_DEAL: "Bundle",
};

export default function CampaignsPage() {
  const totalSpend = DEMO_CAMPAIGNS.reduce((s, c) => s + c.spend, 0);
  const totalRevenue = DEMO_CAMPAIGNS.reduce((s, c) => s + c.revenue, 0);
  const totalConversions = DEMO_CAMPAIGNS.reduce((s, c) => s + c.conversions, 0);
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">แคมเปญ</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            จัดการและวิเคราะห์แคมเปญโปรโมชั่น
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 self-start">
          <Plus className="h-4 w-4" />
          สร้างแคมเปญ
        </button>
      </div>

      {/* API Banner */}
      <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
        <span>⏳</span>
        <span>รอต่อ API — ข้อมูลแคมเปญจริงจะแสดงเมื่อเชื่อมต่อ backend</span>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: "ค่าโฆษณารวม", value: formatCurrency(totalSpend), icon: DollarSign },
          { title: "รายรับจากแคมเปญ", value: formatCurrency(totalRevenue), icon: TrendingUp },
          { title: "ROAS เฉลี่ย", value: `${avgRoas.toFixed(2)}x`, icon: MousePointerClick },
          { title: "Conversions", value: String(totalConversions), icon: Eye },
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

      {/* Campaign Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {DEMO_CAMPAIGNS.map((campaign) => {
          const statusInfo = STATUS_MAP[campaign.status] ?? STATUS_MAP.ACTIVE;
          const budgetPct = Math.min((campaign.spend / campaign.budget) * 100, 100);

          return (
            <div key={campaign.id} className="card card-hover cursor-pointer">
              {/* Card header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="font-semibold text-foreground">{campaign.name}</p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      {TYPE_MAP[campaign.type] ?? campaign.type}
                    </span>
                    <span className={statusInfo.cls}>{statusInfo.label}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-bold text-green-600">
                    {campaign.roas.toFixed(2)}x
                  </p>
                  <p className="text-xs text-muted-foreground">ROAS</p>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="grid grid-cols-4 gap-2 text-center text-sm mb-4">
                {[
                  { v: `${(campaign.impressions / 1000).toFixed(1)}K`, l: "Impressions" },
                  { v: campaign.clicks.toLocaleString(), l: "Clicks" },
                  { v: String(campaign.conversions), l: "Conv." },
                  { v: `${campaign.ctr.toFixed(2)}%`, l: "CTR" },
                ].map(({ v, l }) => (
                  <div key={l}>
                    <p className="font-medium text-foreground">{v}</p>
                    <p className="text-xs text-muted-foreground">{l}</p>
                  </div>
                ))}
              </div>

              {/* Budget progress */}
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>ใช้ไป {formatCurrency(campaign.spend)}</span>
                  <span>งบ {formatCurrency(campaign.budget)}</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-primary rounded-full transition-all"
                    style={{ width: `${budgetPct}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {campaign.startDate} — {campaign.endDate}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
