"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth, type LoginResult } from "@/contexts/AuthContext";
import { RequireGuest } from "@/components/auth/RequireGuest";

export default function LoginPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmCode, setConfirmCode] = useState("");
  const [needConfirm, setNeedConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result: LoginResult = await login(
        email.trim(),
        password,
        needConfirm ? confirmCode : undefined
      );
      if (result === true) {
        router.replace("/");
        return;
      }
      if (result === "need_confirm") {
        setNeedConfirm(true);
        return;
      }
      setError(t("loginFailed"));
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
                disabled={needConfirm}
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
                disabled={needConfirm}
              />
            </div>
            {needConfirm && (
              <div>
                <label htmlFor="confirmCode" className="block text-sm font-medium text-foreground mb-1">
                  {t("confirmCode")}
                </label>
                <input
                  id="confirmCode"
                  type="text"
                  autoComplete="one-time-code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  placeholder={t("placeholderConfirmCode")}
                  className="input-base w-full h-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => { setNeedConfirm(false); setConfirmCode(""); }}
                  className="mt-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {t("backToLogin")}
                </button>
              </div>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-10 disabled:opacity-50"
            >
              {loading ? t("loading") : t("login")}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            {t("devOnlyHint")}
          </p>
        </div>
      </div>
    </RequireGuest>
  );
}
