"use client";

import { UserCog } from "lucide-react";
import { useTranslations } from "next-intl";

export default function UsersPage() {
  const t = useTranslations("users");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
        <span>⏳</span>
        <span>{t("apiNote")}</span>
      </div>

      <div className="card text-center py-12 text-muted-foreground">
        <p className="font-medium text-foreground">{t("empty")}</p>
        <p className="text-sm mt-1">{t("emptyDescription")}</p>
      </div>
    </div>
  );
}
