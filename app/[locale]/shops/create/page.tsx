"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Store, Loader2, Plus, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { apiRequest } from "@/lib/api-client";
import { usePermissions, useUserContext } from "@/contexts/AuthContext";

type ShopData = { name?: string };

type MemberRow = {
  email: string;
  password: string;
  role: "SuperAdmin" | "Admin" | "Affiliate";
};

function ShopManageContent() {
  const t = useTranslations("shopsCreate");
  const { can } = usePermissions();
  const user = useUserContext();

  const [name, setName] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([
    { email: "", password: "", role: "SuperAdmin" },
  ]);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const canCreate = can("shops:create");
  const canUpdate = can("shops:update");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setError("");
      try {
        const data = await apiRequest<ShopData>("/api/shops/me");
        if (!cancelled) {
          setName(data.name ?? "");
          setSavedName(data.name ?? "");
        }
      } catch {
        // no shop yet or not authorized to read; keep blank
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasShop = !!savedName && savedName.trim() !== "";
  const allowCreate = !hasShop && canCreate;
  const allowUpdate = hasShop && canUpdate;

  const hasSuperAdmin = members.some((m) => m.role === "SuperAdmin");
  const allMembersFilled = members.every(
    (m) => m.email.trim() && m.password.trim()
  );

  const updateMember = (
    index: number,
    field: keyof MemberRow,
    value: string
  ) => {
    setMembers((prev) =>
      prev.map((m, i) => (i === index ? { ...m, [field]: value } : m))
    );
  };

  const addMember = () => {
    setMembers((prev) => [...prev, { email: "", password: "", role: "Admin" }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 1) return;
    setMembers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowCreate || !name.trim() || !hasSuperAdmin || !allMembersFilled)
      return;
    setCreating(true);
    setError("");
    try {
      await apiRequest("/api/shops", {
        method: "POST",
        body: JSON.stringify({
          name: name.trim(),
          members: members.map((m) => ({
            email: m.email.trim(),
            password: m.password,
            role: m.role,
          })),
        }),
      });
      setSavedName(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setCreating(false);
    }
  };

  const handleSaveName = async () => {
    if (!allowUpdate || name.trim() === savedName) return;
    setSaving(true);
    setError("");
    try {
      await apiRequest("/api/shops/me", {
        method: "PATCH",
        body: JSON.stringify({ name: name.trim() }),
      });
      setSavedName(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (!canCreate && !canUpdate) {
    return (
      <div className="card border-amber-200 bg-amber-50 text-amber-800 p-4">
        {t("noPermission")}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {t("title")}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasShop ? t("subtitleHasShop") : t("subtitleNoShop")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card h-32 animate-pulse bg-muted/50" />
      ) : hasShop ? (
        /* ── Edit existing shop name ── */
        <div className="card space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("shopNameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!allowUpdate}
              className="input-base w-full h-10"
              placeholder={t("shopNamePlaceholder")}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            {allowUpdate && (
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving || name.trim() === savedName}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  t("saveName")
                )}
              </button>
            )}
            {!allowUpdate && (
              <p className="text-sm text-muted-foreground">{t("alreadyHasShop")}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {t("goToMembers")}
          </p>
        </div>
      ) : (
        /* ── Create new shop with members (SHOPS_AND_ROLES_SPEC §3) ── */
        <form onSubmit={handleCreate} className="card space-y-6 max-w-2xl">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("shopNameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-base w-full h-10"
              placeholder={t("shopNamePlaceholder")}
            />
          </div>

          {/* ── Members section ── */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">
                {t("membersHint")}
              </label>
              <button
                type="button"
                onClick={addMember}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" /> {t("addMember")}
              </button>
            </div>

            {members.map((m, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row gap-2 p-3 rounded-lg border border-border bg-muted/30"
              >
                <input
                  type="email"
                  value={m.email}
                  onChange={(e) => updateMember(idx, "email", e.target.value)}
                  className="input-base flex-1 h-10"
                  placeholder={t("email")}
                />
                <input
                  type="password"
                  value={m.password}
                  onChange={(e) =>
                    updateMember(idx, "password", e.target.value)
                  }
                  className="input-base flex-1 h-10"
                  placeholder={t("password")}
                />
                <select
                  value={m.role}
                  onChange={(e) => updateMember(idx, "role", e.target.value)}
                  className="input-base w-full sm:w-36 h-10"
                >
                  <option value="SuperAdmin">SuperAdmin</option>
                  <option value="Admin">Admin</option>
                  <option value="Affiliate">Affiliate</option>
                </select>
                {members.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="flex items-center justify-center h-10 w-10 shrink-0 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    aria-label={t("removeMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {!hasSuperAdmin && (
              <p className="text-xs text-amber-600">
                ⚠ {t("atLeastOneSuperAdmin")}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={
              creating || !name.trim() || !hasSuperAdmin || !allMembersFilled
            }
            className="btn-primary disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              t("create")
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ShopManagePage() {
  return (
    <RequirePermission permission="shops:create">
      <ShopManageContent />
    </RequirePermission>
  );
}
