"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Package,
  AlertTriangle,
  Plus,
  Upload,
  Calculator,
  BarChart3,
  Zap,
} from "lucide-react";
import { Link as LocaleLink } from "@/i18n/navigation";
import { formatCurrency } from "@/lib/utils";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  useDashboardOverview,
  useDashboardRevenue7d,
  useDashboardLowStock,
  useDashboardKpis,
} from "@/lib/hooks/use-api";
import { usePermissions, useUserContext } from "@/contexts/AuthContext";
import { NAV_PERMISSIONS } from "@/lib/rbac/constants";

const DAYS = ["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"];

const QUICK_ACTIONS = [
  { label: "เพิ่มสินค้า", href: "/inventory", icon: Plus, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
  { label: "นำเข้าข้อมูล", href: "/import", icon: Upload, color: "bg-green-50 text-green-700 hover:bg-green-100" },
  { label: "คำนวณกำไร", href: "/calculator", icon: Calculator, color: "bg-primary/10 text-primary hover:bg-primary/20" },
];

export function DashboardContent() {
  const t = useTranslations("dashboard");
  const { can } = usePermissions();
  const user = useUserContext();
  const overviewQuery = useDashboardOverview();
  const revenueQuery = useDashboardRevenue7d();
  const lowStockQuery = useDashboardLowStock(5);
  const kpiQuery = useDashboardKpis();

  const [orderCountOverride, setOrderCountOverride] = useState<number | null>(null);
  const [costOverride, setCostOverride] = useState<number | null>(null);

  const overview = overviewQuery.data;

  /** ทางลัด: แสดงเฉพาะเมนูที่ role มีสิทธิ์เข้า */
  const quickActionsFiltered = useMemo(
    () =>
      QUICK_ACTIONS.filter((action) => {
        const perm = NAV_PERMISSIONS[action.href as keyof typeof NAV_PERMISSIONS];
        return perm ? can(perm) : true;
      }),
    [can]
  );

  const revenuePoints = useMemo(
    () => revenueQuery.data?.data ?? [],
    [revenueQuery.data?.data]
  );
  const revenueTotal = useMemo(
    () => revenuePoints.reduce((sum, p) => sum + (p.revenue || 0), 0),
    [revenuePoints]
  );
  const revenueAvg = revenuePoints.length ? revenueTotal / revenuePoints.length : 0;
  const maxRevenue = useMemo(
    () => Math.max(...revenuePoints.map((p) => p.revenue || 0), 1),
    [revenuePoints]
  );
  const isAffiliate = user?.role === "Affiliate";

  const lowStock = lowStockQuery.data?.data ?? [];

  const kpiRevenue = kpiQuery.data?.totalRevenue ?? 0;
  const kpiDiscount = kpiQuery.data?.totalDiscount ?? 0;
  const kpiNetBase = kpiQuery.data?.netBase ?? 0;
  const totalOrders = orderCountOverride ?? kpiQuery.data?.totalOrders ?? null;
  const aov = totalOrders && totalOrders > 0 ? kpiRevenue / totalOrders : null;
  const netProfit = costOverride != null ? kpiNetBase - costOverride : kpiNetBase;

  const kpiCardsAll = useMemo(
    () =>
      [
        {
          label: "totalProducts",
          icon: Package,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          href: "/inventory",
          value: overview?.totalProducts,
        },
        {
          label: "lowStock",
          icon: AlertTriangle,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
          href: "/inventory",
          value: overview?.lowStock,
        },
      ] as const,
    [overview?.totalProducts, overview?.lowStock]
  );

  /** KPI การ์ดที่ลิงก์ไป inventory: แสดงเฉพาะเมื่อมีสิทธิ์ inventory:read */
  const canAccessInventory = can("inventory:read");
  const kpiCards = useMemo(
    () => (canAccessInventory ? kpiCardsAll : []),
    [canAccessInventory, kpiCardsAll]
  );

  return (
    <div className="space-y-8">
      {/* Header with gradient accent */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
      </div>

      {/* Section A: KPI overview */}
      <section aria-labelledby="dashboard-overview-heading" className="mb-6">
        <h2 id="dashboard-overview-heading" className="sr-only">
          {t("title")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-4 sm:grid-cols-2 mb-6">
          {/* Revenue Card - Gradient Blue */}
          <div className="relative overflow-hidden card p-6 space-y-2 bg-gradient-to-br from-blue-50 via-white to-blue-50/30 dark:from-blue-950/20 dark:via-background dark:to-blue-950/10 border-blue-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">{t("kpi.revenue")}</p>
            <p className="text-3xl font-bold tabular-nums text-foreground">{formatCurrency(kpiRevenue)}</p>
            <p className="text-xs text-muted-foreground">
              {totalOrders ? `${totalOrders} orders` : t("kpi.ordersUnknown")}
            </p>
          </div>

          {/* Discount Card - Gradient Amber */}
          <div className="relative overflow-hidden card p-6 space-y-2 bg-gradient-to-br from-amber-50 via-white to-amber-50/30 dark:from-amber-950/20 dark:via-background dark:to-amber-950/10 border-amber-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              {isAffiliate ? t("kpi.ineligible") : t("kpi.discount")}
            </p>
            <p className="text-3xl font-bold tabular-nums text-foreground">
              -{formatCurrency(kpiDiscount)}
            </p>
          </div>

          {/* Net Profit Card - Gradient Green */}
          <div className="relative overflow-hidden card p-6 space-y-2 bg-gradient-to-br from-green-50 via-white to-green-50/30 dark:from-green-950/20 dark:via-background dark:to-green-950/10 border-green-200/50 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/10 to-transparent rounded-full -mr-16 -mt-16" />
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">{t("kpi.netProfit")}</p>
              <span className="text-[10px] text-muted-foreground bg-white/80 dark:bg-black/20 px-1.5 py-0.5 rounded">*{t("kpi.netNote")}</span>
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground">{formatCurrency(netProfit)}</p>
            <label className="text-xs text-muted-foreground flex items-center gap-2">
              {t("kpi.inputCost")}:
              <input
                type="number"
                min={0}
                step="1"
                className="input-base w-28 h-8 px-2 text-xs focus:ring-2 focus:ring-green-500/50 transition-all"
                value={costOverride ?? ""}
                onChange={(e) => setCostOverride(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="0"
              />
            </label>
          </div>

          {/* AOV Card - Gradient Purple */}
          {!isAffiliate && (
            <div className="relative overflow-hidden card p-6 space-y-2 bg-gradient-to-br from-purple-50 via-white to-purple-50/30 dark:from-purple-950/20 dark:via-background dark:to-purple-950/10 border-purple-200/50 shadow-sm hover:shadow-md transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full -mr-16 -mt-16" />
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide">{t("kpi.aov")}</p>
              <p className="text-3xl font-bold tabular-nums text-foreground">
                {aov != null ? formatCurrency(aov) : "—"}
              </p>
              <label className="text-xs text-muted-foreground flex items-center gap-2">
                {t("kpi.inputOrders")}:
                <input
                  type="number"
                  min={0}
                  step="1"
                  className="input-base w-24 h-8 px-2 text-xs focus:ring-2 focus:ring-purple-500/50 transition-all"
                  value={orderCountOverride ?? ""}
                  onChange={(e) => setOrderCountOverride(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="orders"
                />
              </label>
            </div>
          )}
        </div>

        {/* Inventory KPI Cards */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 dashboard-kpi-grid">
          {kpiCards.map(({ label, icon: Icon, iconBg, iconColor, href, value }, i) => (
            <LocaleLink
              key={label}
              href={href}
              className={`relative card card-hover group dashboard-kpi-card min-h-[44px] flex flex-col justify-center p-5 overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${i === 0 ? "lg:col-span-2" : ""}`}
            >
              {/* Animated background gradient on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg} shadow-sm group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className={`h-6 w-6 ${iconColor}`} />
                  </div>
                  {overview?.lastImport && (
                    <span className="text-[10px] text-muted-foreground bg-white/80 dark:bg-black/20 px-2 py-1 rounded">
                      {t("importInsights.lastImport")}: {overview.lastImport}
                    </span>
                  )}
                </div>
                <p className="text-3xl font-bold text-foreground tabular-nums mb-2">
                  {value == null ? "—" : value.toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground font-medium">
                  {t(label as "totalProducts" | "lowStock")}
                </p>
                {overviewQuery.isLoading && (
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {t("loading")}
                  </p>
                )}
              </div>
            </LocaleLink>
          ))}
        </div>
      </section>

      {/* Section B: Revenue & low stock */}
      <DashboardSection
        id="revenue-stock"
        title={t("sections.revenueStock")}
        defaultOpen={false}
        chartCount={2}
        icon={<BarChart3 className="h-5 w-5" />}
      >
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Revenue 7d - Enhanced Chart */}
          <div className="card p-6 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("revenue7dTitle")}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">{t("revenue7dSubtitle")}</p>
            </div>
            <div className="flex items-end gap-2 h-40 px-2">
              {DAYS.map((day, idx) => {
                const point = revenuePoints[idx];
                const revenue = point?.revenue || 0;
                const height = Math.max(4, (revenue / maxRevenue) * 100);
                const isHighest = revenue === maxRevenue && revenue > 0;
                return (
                  <div key={day} className="flex flex-col items-center gap-2 flex-1 group">
                    <div className="relative w-full">
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 hover:opacity-80 ${
                          isHighest 
                            ? 'bg-gradient-to-t from-primary via-primary to-primary/70 shadow-lg' 
                            : 'bg-gradient-to-t from-primary/70 to-primary/50'
                        }`}
                        style={{ height: `${height}%` }}
                        title={`${day}: ${formatCurrency(revenue)}`}
                      />
                      {isHighest && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                          สูงสุด
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{day}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex items-center justify-between text-sm border-t border-border pt-4">
              <span className="text-muted-foreground">
                รวม 7 วัน: <strong className="text-foreground text-base">{revenuePoints.length ? formatCurrency(revenueTotal) : "—"}</strong>
              </span>
              <span className="text-muted-foreground">
                เฉลี่ย/วัน: <strong className="text-primary text-base">{revenuePoints.length ? formatCurrency(revenueAvg) : "—"}</strong>
              </span>
            </div>
          </div>

          {/* Low stock list - Enhanced Design */}
          <div className="card p-6 bg-gradient-to-br from-white via-amber-50/30 to-white dark:from-background dark:via-amber-950/10 dark:to-background shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
                <div className="p-2 bg-amber-100 dark:bg-amber-950/30 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                {isAffiliate ? t("lowStockTop") : t("lowStockTitle")}
              </h3>
              {canAccessInventory && !isAffiliate && (
                <LocaleLink
                  href="/inventory"
                  className="text-xs font-medium text-primary hover:text-primary/80 flex items-center gap-1 px-3 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-all min-h-[44px]"
                >
                  {t("viewAll")} →
                </LocaleLink>
              )}
            </div>
            {lowStockQuery.isLoading ? (
              <div className="py-12 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="text-sm text-muted-foreground mt-3">{t("loading")}</p>
              </div>
            ) : lowStock.length === 0 ? (
              <div className="py-12 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 mb-3">
                  <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm text-muted-foreground">
                  {isAffiliate ? t("noTopEarning") : t("noLowStock")}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.map((item, idx) => (
                  <div 
                    key={item.sku} 
                    className="flex items-center justify-between p-3 rounded-lg bg-white/80 dark:bg-black/20 hover:bg-white dark:hover:bg-black/30 transition-all duration-200 border border-transparent hover:border-primary/20"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.sku}</p>
                    </div>
                    <div className="text-right ml-3">
                      {isAffiliate ? (
                        <>
                          <p className="text-base font-bold text-foreground">
                            {formatCurrency(item.amount ?? 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {item.units ? `${item.units.toLocaleString()} orders` : ""}{" "}
                            {item.date ? `· ${item.date.slice(0, 10)}` : ""}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-base font-bold text-amber-700 dark:text-amber-500">{item.qty}</p>
                          <p className="text-[10px] text-muted-foreground">{item.date?.slice(0, 10) ?? ""}</p>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DashboardSection>

      {/* Section D: Shortcuts + activity */}
      <DashboardSection
        id="shortcuts-activity"
        title={t("sections.shortcutsActivity")}
        defaultOpen={false}
        chartCount={2}
        icon={<Zap className="h-5 w-5" />}
      >
        <div className="card p-6 bg-gradient-to-br from-white via-violet-50/30 to-white dark:from-background dark:via-violet-950/10 dark:to-background shadow-sm">
          <h3 className="font-bold text-lg text-foreground mb-6 flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            ทางลัด
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {quickActionsFiltered.map(({ label, href, icon: Icon, color }) => (
              <LocaleLink
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-3 rounded-xl p-4 min-h-[100px] text-center text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg ${color} border border-transparent hover:border-current/20`}
              >
                <div className="p-2 bg-white/50 dark:bg-black/30 rounded-lg">
                  <Icon className="h-6 w-6 shrink-0" />
                </div>
                <span className="text-xs leading-tight">{label}</span>
              </LocaleLink>
            ))}
          </div>
          {quickActionsFiltered.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-muted-foreground">ไม่มีทางลัดตามสิทธิ์ของคุณ</p>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-border space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              กิจกรรมล่าสุด
            </p>
            <div className="bg-gradient-to-r from-muted/50 to-transparent rounded-lg p-4">
              <p className="text-xs text-muted-foreground">ยังไม่มีข้อมูลกิจกรรม</p>
            </div>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
