"use client";

import { use, useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { UserCog, Plus, Trash2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { usePermissions } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { apiRequest } from "@/lib/api-client";
import { mapErrorMessage } from "@/lib/error-mapping";
import { ConfirmModal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { Role } from "@/lib/rbac/types";

type MemberRow = { id?: string; email: string; role: string };

const ALL_ROLES: Role[] = ["SuperAdmin", "Admin", "Affiliate"];

type RoleChangeConfirm = {
  memberId: string;
  email: string;
  newRole: Role;
};

function ShopDetailContent({ shopId }: { shopId: string }) {
  const t = useTranslations("shopsDetail");
  const locale = useLocale() as "en" | "th";
  const { showSuccess, showError } = useToast();
  const { can } = usePermissions();
  const canManage = can("shops:read"); // Admin, SuperAdmin, Root
  const [shopName, setShopName] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<Role>("Admin");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [roleChangeConfirm, setRoleChangeConfirm] = useState<RoleChangeConfirm | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setError("");
    (async () => {
      try {
        const data = await apiRequest<{ name?: string; members?: MemberRow[] }>(`/api/shops/${shopId}`);
        if (!cancelled) {
          setShopName(data.name ?? shopId);
          setMembers(data.members ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(t("error"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [shopId, t]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim() || !addPassword) return;
    setAdding(true);
    setError("");
    try {
      const newMember = await apiRequest<MemberRow>(`/api/shops/${shopId}/members`, {
        method: "POST",
        body: JSON.stringify({ email: addEmail.trim(), password: addPassword, role: addRole }),
      });
      setMembers((prev) => [...prev, { ...newMember, email: addEmail.trim(), role: addRole }]);
      setAddEmail("");
      setAddPassword("");
      showSuccess(t("memberAddedSuccess"));
    } catch (e) {
      showError(mapErrorMessage(e, locale));
    } finally {
      setAdding(false);
    }
  };

  const handleRoleChangeRequest = (memberId: string | undefined, email: string, newRole: Role) => {
    if (!memberId) return;
    setRoleChangeConfirm({ memberId, email, newRole });
  };

  const handleConfirmRoleChange = async () => {
    if (!roleChangeConfirm) return;
    const { memberId, newRole } = roleChangeConfirm;
    setUpdating(memberId);
    setRoleChangeConfirm(null);
    try {
      await apiRequest(`/api/shops/${shopId}/members`, {
        method: "PATCH",
        body: JSON.stringify({ id: memberId, role: newRole }),
      });
      setMembers((prev) => prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)));
      showSuccess(t("roleChangeSuccess"));
    } catch (e) {
      showError(mapErrorMessage(e, locale));
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    setDeleting(id);
    try {
      await apiRequest(`/api/shops/${shopId}/members`, {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setMembers((prev) => prev.filter((m) => m.id !== id));
      showSuccess(t("memberDeletedSuccess"));
    } catch (e) {
      showError(mapErrorMessage(e, locale));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/shops"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToList")}
        </Link>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" />
          {t("title", { name: shopName })}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="card space-y-4">
        <h3 className="font-medium text-foreground">{t("members")}</h3>
        {canManage && (
          <form onSubmit={handleAddMember} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/30">
            <input
              type="email"
              placeholder={t("email")}
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="input-base flex-1 min-w-35 h-9"
              required
            />
            <div className="relative flex-1 min-w-30">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={t("password")}
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                className="input-base w-full h-9 pr-9"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <Select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as Role)}
              className="w-32 h-9"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <button type="submit" disabled={adding} className="btn-primary flex items-center gap-1.5 disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {adding ? t("adding") : t("addMember")}
            </button>
          </form>
        )}
        {canManage && <p className="text-xs text-muted-foreground">{t("addMemberHint")}</p>}

        {members.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">{t("empty")}</p>
        ) : (
          <ul className="divide-y rounded border">
            {members.map((m, i) => (
              <li key={m.id ?? i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {canManage ? (
                    <>
                      <Select
                        value={m.role}
                        onChange={(e) => handleRoleChangeRequest(m.id, m.email, e.target.value as Role)}
                        disabled={updating === m.id}
                        className="h-9 w-36"
                      >
                        {ALL_ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </Select>
                      <button
                        type="button"
                        onClick={() => handleDelete(m.id)}
                        disabled={deleting === m.id}
                        className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-40"
                        aria-label={t("removeMember")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground px-1">{m.role}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      )}

      <ConfirmModal
        open={!!roleChangeConfirm}
        title={t("confirmRoleChange")}
        message={t("confirmRoleChangeMessage", {
          email: roleChangeConfirm?.email ?? "",
          role: roleChangeConfirm?.newRole ?? "",
        })}
        confirmLabel={t("changeRole")}
        onConfirm={handleConfirmRoleChange}
        onCancel={() => setRoleChangeConfirm(null)}
        loading={!!updating}
      />
    </div>
  );
}

export default function ShopDetailPage({ params }: { params: Promise<{ shopId: string }> }) {
  const { shopId } = use(params);
  return (
    <RequirePermission permission="shops:read">
      <ShopDetailContent shopId={shopId} />
    </RequirePermission>
  );
}
