"use client";

import { useState } from "react";
import { UserCog, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useUserContext, useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api-client";

function UsersPageContent() {
  const t = useTranslations("users");
  const userContext = useUserContext();
  const { logout, session } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const isRoot = session?.roles.includes("Root") ?? false;

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
        <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm space-y-3">
          <p className="text-sm font-medium text-muted-foreground">{t("currentContext")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">{t("role")}: </span><span className="font-medium">{userContext.role}</span></div>
            <div><span className="text-muted-foreground">{t("tier")}: </span><span className="font-medium">{userContext.tier}</span></div>
            <div><span className="text-muted-foreground">{t("company")}: </span><span className="font-medium">{userContext.companyId ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Shop: </span><span className="font-medium">{userContext.shopId ?? "—"}</span></div>
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">ID: </span>
              <span className="font-mono text-muted-foreground">{userContext.userId}</span>
            </div>
          </div>
        </div>
      )}

      {!isRoot && (
        <div className="card border-destructive/20 bg-destructive/5 space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <ShieldAlert className="h-5 w-5" />
            <p className="font-semibold">ลบบัญชีผู้ใช้</p>
          </div>
          <p className="text-sm text-muted-foreground">
            การลบจะเป็นการลบร้าน/ข้อมูลที่ผูกกับคุณ (soft delete, ลบจริงหลัง 7 วัน) ถ้าคุณเป็นเจ้าของร้านจะต้องยืนยันว่าลบร้านและสินค้าที่เกี่ยวข้องทั้งหมด
          </p>
          <button
            type="button"
            onClick={async () => {
              if (!confirm("ยืนยันลบบัญชี? หากคุณเป็นเจ้าของร้าน ระบบจะลบร้านและข้อมูลที่เกี่ยวข้องทั้งหมด (soft delete)")) return;
              setDeleting(true);
              setError("");
              try {
                await apiRequest("/api/users/me", { method: "DELETE" });
                logout();
              } catch (e) {
                setError(e instanceof Error ? e.message : "ลบไม่สำเร็จ");
              } finally {
                setDeleting(false);
              }
            }}
            disabled={deleting}
            className="btn-primary bg-destructive hover:bg-destructive/90 border border-destructive/60 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Trash2 className="h-4 w-4" /> ลบบัญชี</>}
          </button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}
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
