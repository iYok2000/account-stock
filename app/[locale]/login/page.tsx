"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth, type LoginResult } from "@/contexts/AuthContext";
import { RequireGuest } from "@/components/auth/RequireGuest";
import { FormModal } from "@/components/ui/Modal";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [pendingRoot, setPendingRoot] = useState<{ email: string; password: string } | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmedEmail = email.trim().toLowerCase();

    // ถ้าเป็น Root (superadmin) แต่ยังไม่ได้กรอกรหัสยืนยัน ให้เปิด modal ขอรหัสก่อน
    if (trimmedEmail === "superadmin" && !confirmCode) {
      setPendingRoot({ email: trimmedEmail, password });
      setShowConfirmModal(true);
      return;
    }

    setLoading(true);
    try {
      const result: LoginResult = await login(
        trimmedEmail,
        password,
        confirmCode ? confirmCode.trim() : undefined
      );
      if (result === true) {
        router.replace("/");
        return;
      }
      setError(result === "need_confirm" ? t("confirmRequired") : t("loginFailed"));
      if (result === "need_confirm" && trimmedEmail === "superadmin") {
        setPendingRoot({ email: trimmedEmail, password });
        setShowConfirmModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireGuest>
      <div className="min-h-screen flex items-center justify-center bg-muted/20 px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {t("signIn")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("signInSubtitle")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="card space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
                {t("emailOrUsername")}
              </label>
              <input
                id="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("placeholderUser")}
                className="input-base w-full h-10"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1">
                {t("password")}
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("placeholderPass")}
                className="input-base w-full h-10"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("loading") : t("login")}
            </button>
          </form>

        </div>
      </div>

      <FormModal
        open={showConfirmModal}
        title={t("confirmCodeTitle")}
        onClose={() => { setShowConfirmModal(false); setConfirmCode(""); setPendingRoot(null); }}
      >
        <p className="text-sm text-muted-foreground mb-3">{t("confirmCodeHint")}</p>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-foreground">
            {t("confirmCode")}
            <input
              type="text"
              autoComplete="one-time-code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              placeholder={t("placeholderConfirmCode")}
              className="input-base w-full mt-1"
            />
          </label>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => { setShowConfirmModal(false); setConfirmCode(""); setPendingRoot(null); }}
              className="btn-secondary"
            >
              {t("backToLogin")}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={loading || !confirmCode.trim()}
              onClick={async () => {
                if (!pendingRoot) {
                  setShowConfirmModal(false);
                  return;
                }
                setLoading(true);
                setError("");
                try {
                  const result = await login(
                    pendingRoot.email,
                    pendingRoot.password,
                    confirmCode.trim()
                  );
                  if (result === true) {
                    setShowConfirmModal(false);
                    router.replace("/");
                    return;
                  }
                  setError(t("loginFailed"));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? t("loading") : t("submitConfirmCode")}
            </button>
          </div>
        </div>
      </FormModal>
    </RequireGuest>
  );
}
