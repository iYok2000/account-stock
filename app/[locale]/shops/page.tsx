"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Store, Users, ChevronRight, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { usePermissions } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api-client";

type ShopListItem = {
  id: string;
  company_id: string;
  name: string;
  member_count: number;
  created_at: string;
};

function ShopsListContent() {
  const t = useTranslations("shopsList");
  const { can } = usePermissions();
  const [shops, setShops] = useState<ShopListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<ShopListItem[]>("/api/shops");
        if (!cancelled) setShops(data ?? []);
      } catch {
        if (!cancelled) setError(t("error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store className="h-7 w-7 text-primary" />
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        {can("shops:create") && (
          <Link
            href="/shops/create"
            className="btn-primary flex items-center gap-1.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            {t("createNew")}
          </Link>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && shops.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Store className="h-12 w-12 text-muted-foreground/40 mb-4" />
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </div>
      )}

      {!loading && !error && shops.length > 0 && (
        <div className="card divide-y">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/shops/${shop.id}`}
              className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-muted/40 transition-colors group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{shop.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <Users className="h-3 w-3" />
                    {t("memberCount", { count: shop.member_count })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-primary font-medium hidden sm:block">
                  {t("manageMembers")}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ShopsListPage() {
  return (
    <RequirePermission permission="shops:read">
      <ShopsListContent />
    </RequirePermission>
  );
}
