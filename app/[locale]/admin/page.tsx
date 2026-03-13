"use client";

import { Link as LocaleLink } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Shield,
  Ticket,
  ChevronRight,
  Store,
  Crown,
} from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useUserContext } from "@/contexts/AuthContext";

function AdminDashboardContent() {
  const t = useTranslations("admin");
  const user = useUserContext();
  const isRoot = user?.role === "Root";
  const isSuperAdmin = user?.role === "SuperAdmin";

  const adminSections = [
    {
      title: t("invites.title"),
      description: t("invites.description"),
      icon: Ticket,
      href: "/admin/invites",
      color: "text-primary bg-primary/10",
      show: isRoot || isSuperAdmin,
    },
    {
      title: t("tiers.title"),
      description: t("tiers.description"),
      icon: Crown,
      href: "/admin/tiers",
      color: "text-amber-600 bg-amber-100 dark:bg-amber-950",
      show: isRoot || isSuperAdmin,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Shield className="h-8 w-8 text-primary" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* User Context Card */}
      {user && (
        <div className="card p-4 space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {t("currentContext")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">Role: </span>
              <span className="font-medium text-foreground">{user.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tier: </span>
              <span className="font-medium text-foreground">{user.tier}</span>
            </div>
            {user.shopId && (
              <div className="sm:col-span-2">
                <span className="text-muted-foreground">Shop ID: </span>
                <span className="font-mono text-muted-foreground">{user.shopId}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Sections Grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {adminSections
          .filter((section) => section.show)
          .map((section) => (
            <LocaleLink key={section.href} href={section.href}>
              <div className="card p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${section.color}`}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </LocaleLink>
          ))}
      </div>

      {/* Quick Stats (if Root) */}
      {isRoot && (
        <div className="card p-6 space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Store className="h-5 w-5" />
            {t("platformOverview.title")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">{t("platformOverview.totalShops")}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">{t("platformOverview.totalUsers")}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">{t("platformOverview.activeInvites")}</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold text-foreground">—</p>
              <p className="text-sm text-muted-foreground">{t("platformOverview.proUsers")}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t("platformOverview.awaitingApi")}
          </p>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <RequirePermission permission="users:read">
      <AdminDashboardContent />
    </RequirePermission>
  );
}
