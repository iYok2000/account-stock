"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import {
  DollarSign,
  Package,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalyticsCard {
  titleKey: string;
  descKey: string;
  icon: React.ElementType;
  href: string;
  color: string;
}

const CARDS: AnalyticsCard[] = [
  {
    titleKey: "revenue.title",
    descKey: "revenue.description",
    icon: DollarSign,
    href: "/analytics/revenue",
    color: "bg-blue-50 text-blue-600",
  },
  {
    titleKey: "products.title",
    descKey: "products.description",
    icon: Package,
    href: "/analytics/products",
    color: "bg-purple-50 text-purple-600",
  },
];

function AnalyticsHubContent() {
  const t = useTranslations("analytics");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
          <div className="bg-muted p-2.5 rounded-xl">
            <BarChart3 className="h-6 w-6 text-primary" />
          </div>
          {t("title")}
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm pl-1">
          {t("description")}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href} className="block group">
              <div className="h-full bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200 hover:border-primary/30 active:scale-[0.98] flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className={cn("rounded-xl p-3", card.color)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-muted p-1.5 rounded-full">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">
                  {t(card.titleKey as Parameters<typeof t>[0])}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed grow">
                  {t(card.descKey as Parameters<typeof t>[0])}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Getting Started Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="rounded-xl bg-blue-100 p-2.5 shrink-0">
          <TrendingUp className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-blue-900 mb-1">
            เริ่มต้นใช้งานวิเคราะห์เชิงลึก
          </h3>
          <p className="text-sm text-blue-800 mb-3 leading-relaxed">
            นำเข้าข้อมูลจาก TikTok Shop เพื่อดูข้อมูลวิเคราะห์ที่สมบูรณ์
            ระบบจะสร้างกราฟเจาะลึกและตารางสรุปให้อัตโนมัติ
          </p>
          <Link
            href="/import"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 px-4 py-2 rounded-lg transition-all"
          >
            {t("goImport")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <RequirePermission permission="analytics:read">
      <AnalyticsHubContent />
    </RequirePermission>
  );
}
