"use client";

import { useTranslations } from "next-intl";
import { Crown } from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";

function TierManagementContent() {
  const t = useTranslations("admin");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Crown className="h-8 w-8 text-amber-600" />
          {t("tiers.title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("tiers.description")}
        </p>
      </div>

      <div className="card p-8 text-center space-y-3">
        <Crown className="h-12 w-12 mx-auto text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          {t("platformOverview.awaitingApi")}
        </p>
      </div>
    </div>
  );
}

export default function TierManagementPage() {
  return (
    <RequirePermission permission="invites:read">
      <TierManagementContent />
    </RequirePermission>
  );
}
