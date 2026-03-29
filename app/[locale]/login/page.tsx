"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth, type LoginResult } from "@/contexts/AuthContext";
import { RequireGuest } from "@/components/auth/RequireGuest";
import { FormModal } from "@/components/ui/Modal";
import { env } from "@/lib/env";

const devCreds = env().NEXT_PUBLIC_DEV_EMAIL
  ? {
      email: env().NEXT_PUBLIC_DEV_EMAIL,
      password: env().NEXT_PUBLIC_DEV_PASSWORD,
      confirmCode: env().NEXT_PUBLIC_DEV_CONFIRM_CODE,
    }
  : null;

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

  const fillDevCreds = () => {
    if (!devCreds) return;
    setEmail(devCreds.email);
    setPassword(devCreds.password);
    setConfirmCode(devCreds.confirmCode);
  };

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-50/30 px-4 py-12 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          {/* Logo/Brand section */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/20 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t("signIn")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("signInSubtitle")}
            </p>
          </div>

          {/* Login form card */}
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg shadow-xl shadow-neutral-200/50 p-8 space-y-6 backdrop-blur-sm">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t("emailOrUsername")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t("placeholderUser")}
                    className="input-base w-full h-11 pl-10 transition-all focus:scale-[1.01]"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  {t("password")}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t("placeholderPass")}
                    className="input-base w-full h-11 pl-10 transition-all focus:scale-[1.01]"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-md bg-red-50 border border-red-200 text-red-800" role="alert">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("loading")}
                </span>
              ) : (
                t("login")
              )}
            </button>

            {devCreds && (
              <button
                type="button"
                onClick={fillDevCreds}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-neutral-300 rounded hover:border-primary hover:bg-primary-light"
              >
                Dev: fill Root credentials
              </button>
            )}
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
