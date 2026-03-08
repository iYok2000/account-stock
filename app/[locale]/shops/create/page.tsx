"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Store, Loader2 } from "lucide-react";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { apiRequest } from "@/lib/api-client";
import { usePermissions, useUserContext } from "@/contexts/AuthContext";

type ShopData = { name?: string };

function ShopManageContent() {
  const t = useTranslations("shopsCreate");
  const { can } = usePermissions();
  const user = useUserContext();

  const [name, setName] = useState("");
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allowCreate || !name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await apiRequest("/api/shops", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), members: [] }),
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
        ไม่มีสิทธิ์เข้าถึงหน้าจัดการร้านค้า
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="h-7 w-7 text-primary" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            ร้านค้า / แบรนด์
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {hasShop ? "จัดการชื่อร้านของคุณ" : "สร้างร้านค้า (สร้างได้ 1 ร้านต่อบัญชี)"}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="card h-32 animate-pulse bg-muted/50" />
      ) : (
        <form onSubmit={handleCreate} className="card space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              ชื่อร้าน / แบรนด์
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={hasShop && !allowUpdate}
              className="input-base w-full h-10"
              placeholder="กรอกชื่อร้าน"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            {!hasShop && allowCreate && (
              <button
                type="submit"
                disabled={creating || !name.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "สร้างร้านค้า"}
              </button>
            )}
            {hasShop && allowUpdate && (
              <button
                type="button"
                onClick={handleSaveName}
                disabled={saving || name.trim() === savedName}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "บันทึกชื่อร้าน"}
              </button>
            )}
            {hasShop && !allowUpdate && (
              <p className="text-sm text-muted-foreground">คุณมีร้านแล้ว</p>
            )}
          </div>

          {hasShop && (
            <p className="text-xs text-muted-foreground">
              หากต้องการเพิ่มสมาชิก ไปที่เมนู “สมาชิกร้าน”
            </p>
          )}
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
