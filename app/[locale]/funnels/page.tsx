"use client";

import { ArrowRight, Lightbulb, TrendingUp, Users } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const FUNNEL_DATA = [
  { stage: "U", stageEn: "Unaware", visitors: 12450, conversionRate: 8.2, color: "bg-[#8B6E4E]" },
  { stage: "P", stageEn: "Problem-Aware", visitors: 1021, conversionRate: 22.1, color: "bg-[#A67C52]" },
  { stage: "S", stageEn: "Solution-Aware", visitors: 226, conversionRate: 31.4, color: "bg-[#6B8E6B]" },
  { stage: "Y", stageEn: "Your Solution", visitors: 71, conversionRate: 38.0, color: "bg-[#C8975E]" },
  { stage: "D", stageEn: "Deal", visitors: 27, conversionRate: 0, color: "bg-[#B85C38]" },
];

const STAGE_DETAILS = [
  {
    code: "U", name: "Unaware", nameTh: "ยังไม่รู้จัก",
    description: "ลูกค้ายังไม่รู้จักแบรนด์/สินค้าของเรา",
    kpis: ["Video/Post Views: 45.2K", "Reach: 89.1K", "Profile Visits: 2.3K"],
    topContent: "คอนเทนต์ 'ปัญหาที่ลูกค้าเจอบ่อย' - 12.4K views",
    recommendation: "เพิ่ม content viral ที่เกี่ยวกับ pain point ของกลุ่มเป้าหมาย",
    borderColor: "border-l-[#8B6E4E]",
  },
  {
    code: "P", name: "Problem-Aware", nameTh: "รู้ปัญหา",
    description: "ลูกค้ารู้ว่ามีปัญหาแต่ยังไม่รู้ solution",
    kpis: ["Watch Time: 2m 15s", "Saves: 342", "Comments: 89"],
    topContent: "คอนเทนต์ 'ทำไมถึงเกิดปัญหานี้' - 3.1K views",
    recommendation: "ทำ content แบบ 'ใครเคยเจอปัญหานี้บ้าง' เพิ่มขึ้น",
    borderColor: "border-l-[#A67C52]",
  },
  {
    code: "S", name: "Solution-Aware", nameTh: "รู้ทางแก้",
    description: "ลูกค้ารู้ว่ามี solution แต่ยังไม่รู้จักสินค้าเรา",
    kpis: ["Page Views: 1.2K", "Wishlist: 89", "Link Clicks: 342"],
    topContent: "LIVE สาธิตการใช้งานสินค้า - 1.8K viewers",
    recommendation: "เพิ่ม tutorial content — conversion สูงกว่า 40%",
    borderColor: "border-l-[#6B8E6B]",
  },
  {
    code: "Y", name: "Your Solution", nameTh: "รู้จักสินค้าเรา",
    description: "ลูกค้ารู้จักสินค้าเราแล้ว กำลังพิจารณา",
    kpis: ["Add to Cart: 45", "Return Visits: 28", "DM: 15"],
    topContent: "รีวิวจากลูกค้าจริง @review - 5.2K views",
    recommendation: "เพิ่ม social proof และ testimonials จากลูกค้าจริง",
    borderColor: "border-l-[#C8975E]",
  },
  {
    code: "D", name: "Deal", nameTh: "ปิดการขาย",
    description: "ลูกค้าพร้อมซื้อ ต้องการ offer/deal",
    kpis: ["Purchases: 27", "AOV: ฿459", "Revenue: ฿12,393"],
    topContent: "Flash Sale ลดพิเศษ — 27 orders",
    recommendation: "ทดลอง LIVE ช่วงเย็น 18-20 น. engagement สูงสุด",
    borderColor: "border-l-[#B85C38]",
  },
];

const overallConversion = (27 / 12450) * 100;
const maxVisitors = FUNNEL_DATA[0].visitors;

export default function FunnelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">UPSYD Funnel</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          วิเคราะห์ marketing funnel ตาม UPSYD model (Unaware → Problem → Solution → Your solution → Deal)
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[
          {
            icon: TrendingUp,
            iconBg: "bg-green-100",
            iconColor: "text-green-600",
            label: "รายรับจาก Funnel",
            value: formatCurrency(12393),
          },
          {
            icon: Users,
            iconBg: "bg-primary/10",
            iconColor: "text-primary",
            label: "Overall Conversion",
            value: `${overallConversion.toFixed(2)}%`,
          },
          {
            icon: ArrowRight,
            iconBg: "bg-secondary/30",
            iconColor: "text-secondary-foreground",
            label: "Avg. Journey Time",
            value: "4.2 วัน",
          },
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

      {/* Funnel visualization */}
      <div className="card">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Funnel Visualization</h3>
          <p className="text-sm text-muted-foreground mt-0.5">สัดส่วนจำนวนลูกค้าในแต่ละ stage</p>
        </div>
        <div className="space-y-2">
          {FUNNEL_DATA.map((item) => {
            const pct = (item.visitors / maxVisitors) * 100;
            return (
              <div key={item.stage} className="flex items-center gap-3">
                <div className="w-6 text-center">
                  <span className="text-xs font-bold text-muted-foreground">{item.stage}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{item.stageEn}</span>
                    <span>{item.visitors.toLocaleString()} คน</span>
                  </div>
                  <div className="w-full h-6 bg-muted rounded overflow-hidden">
                    <div
                      className={`h-6 rounded flex items-center px-2 transition-all ${item.color}`}
                      style={{ width: `${Math.max(pct, 3)}%` }}
                    >
                      {pct > 20 && (
                        <span className="text-white text-xs font-medium">
                          {pct.toFixed(1)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {item.conversionRate > 0 && (
                  <div className="w-20 text-right">
                    <span className="text-xs text-muted-foreground">
                      → {item.conversionRate}%
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">รายละเอียดแต่ละ Stage</h3>
        {STAGE_DETAILS.map((stage) => (
          <div
            key={stage.code}
            className={`card border-l-4 ${stage.borderColor}`}
          >
            <div className="mb-3">
              <h4 className="font-semibold text-foreground">
                {stage.code} — {stage.name}{" "}
                <span className="text-muted-foreground font-normal text-sm">({stage.nameTh})</span>
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">{stage.description}</p>
            </div>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-1.5 text-foreground">KPIs</p>
                <ul className="space-y-1">
                  {stage.kpis.map((kpi) => (
                    <li key={kpi} className="text-sm text-muted-foreground">• {kpi}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5 text-foreground">Top Content</p>
                <p className="text-sm text-muted-foreground">{stage.topContent}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5 flex items-center gap-1 text-foreground">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  คำแนะนำ
                </p>
                <p className="text-sm text-muted-foreground">{stage.recommendation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
