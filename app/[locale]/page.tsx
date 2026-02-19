import { getTranslations } from "next-intl/server";
import { Link as LocaleLink } from "@/i18n/navigation";
import {
  Package, ShoppingCart, AlertTriangle, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle2,
  Truck, Plus, Upload, Calculator, FileText,
} from "lucide-react";

// ─── Demo data (replace with real API data when backend is ready) ───────────

const KPI_CARDS = [
  {
    label: "totalProducts", icon: Package, iconBg: "bg-blue-100", iconColor: "text-blue-600",
    value: "1,247", trend: +12.3, trendLabel: "จากเดือนก่อน", href: "/inventory",
  },
  {
    label: "lowStock", icon: AlertTriangle, iconBg: "bg-amber-100", iconColor: "text-amber-600",
    value: "23", trend: -4, trendLabel: "แก้ไขแล้ว 4 รายการ", href: "/inventory",
  },
  {
    label: "pendingOrders", icon: ShoppingCart, iconBg: "bg-purple-100", iconColor: "text-purple-600",
    value: "48", trend: +8, trendLabel: "จากเมื่อวาน", href: "/orders",
  },
  {
    label: "ordersToday", icon: TrendingUp, iconBg: "bg-green-100", iconColor: "text-green-600",
    value: "฿285K", trend: +8.3, trendLabel: "ยอดเดือนนี้", href: "/reports",
  },
];

const REVENUE_CHART = [
  { day: "จ", value: 35000 },
  { day: "อ", value: 42000 },
  { day: "พ", value: 31000 },
  { day: "พฤ", value: 55000 },
  { day: "ศ", value: 48000 },
  { day: "ส", value: 67000 },
  { day: "อา", value: 52000 },
];

const LOW_STOCK_ITEMS = [
  { name: "กางเกงยีนส์ Slim Fit M", sku: "SKU-001", qty: 3, min: 10 },
  { name: "เสื้อโปโล สีขาว L", sku: "SKU-045", qty: 5, min: 15 },
  { name: "รองเท้าผ้าใบ 42", sku: "SKU-112", qty: 2, min: 8 },
  { name: "กระเป๋าผ้า Canvas M", sku: "SKU-089", qty: 7, min: 20 },
  { name: "หมวก Cap สีดำ", sku: "SKU-203", qty: 4, min: 12 },
];

const RECENT_ORDERS = [
  { id: "ORD-0052", customer: "สมชาย วงษ์ดี", items: 2, amount: 1250, status: "PENDING" },
  { id: "ORD-0051", customer: "วิไล สุขใจ", items: 1, amount: 890, status: "SHIPPED" },
  { id: "ORD-0050", customer: "ณัฐพล มั่นคง", items: 3, amount: 2340, status: "DELIVERED" },
  { id: "ORD-0049", customer: "พรรณี ทองดี", items: 1, amount: 450, status: "PENDING" },
  { id: "ORD-0048", customer: "อานนท์ ชัยยา", items: 2, amount: 1680, status: "CONFIRMED" },
];

const QUICK_ACTIONS = [
  { label: "เพิ่มสินค้า", href: "/inventory", icon: Plus, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "นำเข้าข้อมูล", href: "/import", icon: Upload, color: "bg-green-50 text-green-700 hover:bg-green-100" },
  { label: "คำนวณกำไร", href: "/calculator", icon: Calculator, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
  { label: "ดูรายงาน", href: "/reports", icon: FileText, color: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
];

const STATUS_CONFIG = {
  PENDING: { label: "รอดำเนินการ", cls: "bg-amber-100 text-amber-700", icon: Clock },
  CONFIRMED: { label: "ยืนยันแล้ว", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
  SHIPPED: { label: "จัดส่งแล้ว", cls: "bg-purple-100 text-purple-700", icon: Truck },
  DELIVERED: { label: "ส่งถึงแล้ว", cls: "bg-green-100 text-green-700", icon: CheckCircle2 },
};

const maxRevenue = Math.max(...REVENUE_CHART.map((d) => d.value));

// ────────────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("description")}</p>
        </div>
        <span className="hidden sm:inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700">
          ⏳ Demo data — รอต่อ API
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {KPI_CARDS.map(({ label, icon: Icon, iconBg, iconColor, value, trend, trendLabel, href }) => (
          <LocaleLink key={label} href={href} className="card card-hover group">
            <div className="flex items-start justify-between mb-3">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <span
                className={`flex items-center gap-0.5 text-xs font-medium ${
                  trend >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t(label as "totalProducts" | "lowStock" | "pendingOrders" | "ordersToday")}
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{trendLabel}</p>
          </LocaleLink>
        ))}
      </div>

      {/* Revenue chart + Low stock alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 7-day Revenue Chart (CSS bars) */}
        <div className="card lg:col-span-2">
          <div className="mb-4">
            <h3 className="font-semibold text-foreground">รายรับ 7 วันล่าสุด</h3>
            <p className="text-xs text-muted-foreground mt-0.5">ยอดรายรับรายวัน (บาท)</p>
          </div>
          <div className="flex items-end gap-2 h-36">
            {REVENUE_CHART.map(({ day, value }) => {
              const heightPct = (value / maxRevenue) * 100;
              return (
                <div key={day} className="flex flex-col items-center gap-1 flex-1 group">
                  <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity tabular-nums">
                    {(value / 1000).toFixed(0)}K
                  </span>
                  <div
                    className="w-full rounded-t-sm bg-primary/70 group-hover:bg-primary transition-colors"
                    style={{ height: `${heightPct}%`, minHeight: "4px" }}
                  />
                  <span className="text-xs text-muted-foreground">{day}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground border-t border-border pt-3">
            <span>รวม 7 วัน: <strong className="text-foreground">฿330,000</strong></span>
            <span>เฉลี่ย/วัน: <strong className="text-foreground">฿47,143</strong></span>
          </div>
        </div>

        {/* Low stock alerts */}
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
          <div className="space-y-2.5">
            {LOW_STOCK_ITEMS.map((item) => (
              <div key={item.sku} className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.sku}</p>
                </div>
                <span className="text-sm font-bold text-red-600 shrink-0">{item.qty}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders + Quick actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent orders */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">คำสั่งซื้อล่าสุด</h3>
            <LocaleLink href="/orders" className="text-xs text-primary hover:underline">
              ดูทั้งหมด →
            </LocaleLink>
          </div>
          <div className="space-y-0">
            {RECENT_ORDERS.map((order) => {
              const status = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
              return (
                <div
                  key={order.id}
                  className="flex items-center gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  <div className="font-mono text-xs text-muted-foreground w-20 shrink-0">
                    {order.id}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{order.customer}</p>
                    <p className="text-xs text-muted-foreground">{order.items} รายการ</p>
                  </div>
                  <div className="text-sm font-semibold text-foreground shrink-0">
                    ฿{order.amount.toLocaleString()}
                  </div>
                  <span
                    className={`hidden sm:inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${status.cls}`}
                  >
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="card">
          <h3 className="font-semibold text-foreground mb-4">ทางลัด</h3>
          <div className="grid grid-cols-2 gap-2">
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
          {/* Mini activity feed */}
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground">กิจกรรมล่าสุด</p>
            {[
              "นำเข้าสินค้าใหม่ 12 รายการ",
              "อัพเดทสต็อก SKU-045",
              "ยืนยัน ORD-0050",
            ].map((activity, i) => (
              <p key={i} className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                {activity}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
