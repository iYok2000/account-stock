import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";
import {
  Package, AlertTriangle,
  Plus, Upload, Calculator,
} from "lucide-react";
import { ImportInsights } from "@/components/dashboard/ImportInsights";

const DAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const KPI_CARDS = [
  {
    label: "totalProducts", icon: Package, iconBg: "bg-blue-100", iconColor: "text-blue-600",
    href: "/inventory",
  },
  {
    label: "lowStock", icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-amber-600",
    href: "/inventory",
  },
];

const QUICK_ACTIONS = [
  { label: "เพิ่มสินค้า", href: "/inventory", icon: Plus, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "นำเข้าข้อมูล", href: "/import", icon: Upload, color: "bg-green-50 text-green-700 hover:bg-green-100" },
  { label: "คำนวณกำไร", href: "/calculator", icon: Calculator, color: "bg-primary/10 text-primary hover:bg-primary/20" },
];

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("description")}</p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          รอต่อ API
        </span>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 dashboard-kpi-grid">
        {KPI_CARDS.map(({ label, icon: Icon, iconBg, iconColor, href }, i) => (
          <LocaleLink
            key={label}
            href={href}
            className={`card card-hover group dashboard-kpi-card ${i === 0 ? "lg:col-span-2" : ""}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">—</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(label as "totalProducts" | "lowStock")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">รอต่อ API</p>
          </LocaleLink>
        ))}
      </div>

      <ImportInsights />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="card lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">รายรับ 7 วันล่าสุด</h3>
            <p className="text-xs text-muted-foreground mt-0.5">ยอดรายรับรายวัน (บาท)</p>
          </div>
          <div className="flex items-end gap-2 h-36">
            {DAYS.map((day) => (
              <div key={day} className="flex flex-col items-center gap-1 flex-1">
                <div className="w-full rounded-t-sm bg-muted min-h-[4px]" />
                <span className="text-xs text-muted-foreground">{day}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <span>รวม 7 วัน: <strong className="text-foreground">—</strong></span>
            <span>เฉลี่ย/วัน: <strong className="text-foreground">—</strong></span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              สต็อกใกล้หมด
            </h3>
            <LocaleLink href="/inventory" className="text-xs text-primary hover:underline">
              ดูทั้งหมด →
            </LocaleLink>
          </div>
          <div className="py-8 text-center text-sm text-muted-foreground">
            ไม่มีข้อมูล — รอต่อ API
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-foreground mb-4">ทางลัด</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {QUICK_ACTIONS.map(({ label, href, icon: Icon, color }) => (
            <LocaleLink
              key={href}
              href={href}
              className={`flex flex-col items-center gap-2 rounded-lg p-3 text-center text-sm font-medium transition-colors ${color}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs leading-tight">{label}</span>
            </LocaleLink>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-border space-y-2">
          <p className="text-xs font-medium text-muted-foreground">กิจกรรมล่าสุด</p>
          <p className="text-xs text-muted-foreground">ไม่มีข้อมูล — รอต่อ API</p>
        </div>
      </div>
    </div>
  );
}
