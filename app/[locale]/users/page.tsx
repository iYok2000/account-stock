"use client";

import { UserCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useUserContext } from "@/contexts/AuthContext";

function UsersPageContent() {
  const t = useTranslations("users");
  const userContext = useUserContext();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {userContext && (
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">{t("currentContext")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">{t("role")}: </span>
              <span className="font-medium">{userContext.role}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("tier")}: </span>
              <span className="font-medium">{userContext.tier}</span>
            </div>
            <div>
              <span className="text-muted-foreground">{t("company")}: </span>
              <span className="font-medium">{userContext.companyId ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID: </span>
              <span className="font-mono text-muted-foreground">{userContext.userId}</span>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <span>⏳</span>
        <span>{t("apiNote")}</span>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left font-medium p-3">{t("tableName")}</th>
                <th className="text-left font-medium p-3">{t("tableRole")}</th>
                <th className="text-left font-medium p-3">{t("tableTier")}</th>
                <th className="text-left font-medium p-3">{t("tableCompany")}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={4} className="p-8 text-center text-muted-foreground">
                  <p className="font-medium text-foreground">{t("empty")}</p>
                  <p className="text-sm mt-1">{t("emptyDescription")}</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  return (
    <RequirePermission permission="users:read">
      <UsersPageContent />
    </RequirePermission>
  );
}
