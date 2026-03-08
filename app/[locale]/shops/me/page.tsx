"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { UserCog, Plus, Trash2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useUserContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api-client";
import type { Role } from "@/lib/rbac/types";

type MemberRow = { id?: string; email: string; role: string };

const ADD_ROLES: Role[] = ["Admin", "Affiliate"];

function ShopMembersContent() {
  const t = useTranslations("shopsMe");
  const userContext = useUserContext();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<Role>("Admin");
  const [adding, setAdding] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError("");
    (async () => {
      try {
        const data = await apiRequest<{ members?: MemberRow[] }>("/api/shops/me");
        if (!cancelled) {
          setMembers(data.members ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(t("error"));
          setMembers([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t, userContext?.shopName]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addEmail.trim() || !addPassword) return;
    setAdding(true);
    setError("");
    try {
      const newMember = await apiRequest<MemberRow>("/api/shops/me/members", {
        method: "POST",
        body: JSON.stringify({
          email: addEmail.trim(),
          password: addPassword,
          role: addRole,
        }),
      });
      setMembers((prev) => [...prev, { ...newMember, email: addEmail.trim(), role: addRole }]);
      setAddEmail("");
      setAddPassword("");
    } catch (e) {
      setError(t("error"));
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (id: string | undefined, role: Role) => {
    if (!id) return;
    setUpdating(id);
    setError("");
    try {
      await apiRequest<MemberRow>("/api/shops/me/members", {
        method: "PATCH",
        body: JSON.stringify({ id, role }),
      });
      setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, role } : m)));
    } catch (e) {
      setError(t("error"));
    } finally {
      setUpdating(null);
    }
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id) return;
    setDeleting(id);
    setError("");
    try {
      await apiRequest("/api/shops/me/members", {
        method: "DELETE",
        body: JSON.stringify({ id }),
      });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e) {
      setError(t("error"));
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <UserCog className="h-7 w-7 text-primary" />
          {t("title")}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="card space-y-4">
        <h3 className="font-medium text-foreground">{t("members")}</h3>
        <form onSubmit={handleAddMember} className="flex flex-wrap items-end gap-3 p-3 rounded-lg border bg-muted/30">
          <input
            type="email"
            placeholder={t("email")}
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            className="input-base flex-1 min-w-[140px] h-9"
            required
          />
          <input
            type="password"
            placeholder={t("password")}
            value={addPassword}
            onChange={(e) => setAddPassword(e.target.value)}
            className="input-base flex-1 min-w-[120px] h-9"
            required
          />
          <select
            value={addRole}
            onChange={(e) => setAddRole(e.target.value as Role)}
            className="input-base w-[120px] h-9"
          >
            {ADD_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={adding} className="btn-primary disabled:opacity-50">
            {adding ? t("adding") : t("addMember")}
          </button>
        </form>
        <p className="text-xs text-muted-foreground">{t("addMemberHint")}</p>
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
                  <select
                    value={m.role}
                    onChange={(e) => handleUpdateRole(m.id, e.target.value as Role)}
                    disabled={updating === m.id}
                    className="input-base h-9"
                  >
                    {ADD_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    disabled={deleting === m.id}
                    className="p-2 text-muted-foreground hover:text-destructive disabled:opacity-40"
                    aria-label={t("removeMember")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export default function ShopMembersPage() {
  return (
    <RequirePermission permission="users:read">
      <ShopMembersContent />
    </RequirePermission>
  );
}
