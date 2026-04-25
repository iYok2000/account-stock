"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { RequireGuest } from "@/components/auth/RequireGuest";
import { apiRequest } from "@/lib/api-client";

export default function InvitePage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill from query string e.g. /invite?code=STOCK-ABC123
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("code");
    if (q) setCode(q.trim().toUpperCase());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await apiRequest<{ valid: boolean; message?: string }>(
        "/api/invite/validate",
        { method: "POST", body: JSON.stringify({ code: trimmed }) }
      );
      if (!res.valid) {
        setError(res.message ?? t("inviteInvalid"));
        return;
      }
      // Store validated code for the register page
      sessionStorage.setItem("invite_code", trimmed);
      router.push("/register");
    } catch {
      setError(t("inviteCheckFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RequireGuest>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-background to-blue-50/30 px-4 py-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-md space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary-hover shadow-lg shadow-primary/20 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("inviteTitle")}</h1>
            <p className="text-sm text-muted-foreground">{t("inviteSubtitle")}</p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-card border border-border rounded-lg shadow-xl shadow-neutral-200/50 p-8 space-y-6 backdrop-blur-sm"
          >
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-foreground mb-2">
                {t("inviteCode")}
              </label>
              <input
                id="code"
                type="text"
                autoComplete="off"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("invitePlaceholder")}
                className="input-base w-full h-11 tracking-widest text-center font-mono text-lg uppercase"
                required
              />
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
              disabled={loading || !code.trim()}
              className="btn-primary w-full h-12 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t("inviteLoading")}
                </span>
              ) : (
                t("inviteSubmit")
              )}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline font-medium">
                {t("backToLoginLink")}
              </a>
            </p>
          </form>
        </div>
      </div>
    </RequireGuest>
  );
}
