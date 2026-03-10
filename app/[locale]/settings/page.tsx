"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  User,
  Lock,
  Globe,
  LogOut,
  Check,
  Eye,
  EyeOff,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { useAuth, useUserContext } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

/* ─── helpers ────────────────────────────────────────────────────── */
function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  Root: "Root",
  SuperAdmin: "เจ้าของร้าน",
  Admin: "ผู้จัดการ",
  Affiliate: "Affiliate",
};

const TIER_LABELS: Record<string, string> = {
  free: "ฟรี",
  paid: "แพ็กเกจจ่ายเงิน",
};

const LOCALES = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "English", flag: "🇬🇧" },
] as const;

/* ─── Section wrapper ────────────────────────────────────────────── */
function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <div className="px-5 py-5 space-y-4">{children}</div>
    </section>
  );
}

/* ─── Label+input row ────────────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <label className="shrink-0 text-xs font-medium text-muted-foreground sm:w-32">
        {label}
      </label>
      <div className="flex-1">{children}</div>
    </div>
  );
}

/* ─── PasswordInput ──────────────────────────────────────────────── */
function PasswordInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        aria-label={show ? "ซ่อนรหัส" : "แสดงรหัส"}
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────────────────── */
export default function SettingsPage() {
  const t = useTranslations("settings");
  const { session, logout, refetch } = useAuth();
  const user = useUserContext();
  const { showSuccess, showError } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [localePending, startLocaleTransition] = useTransition();

  /* profile */
  const [displayName, setDisplayName] = useState(session?.displayName ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  /* password */
  const [pwOpen, setPwOpen] = useState(false);
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  /* ── handlers ── */
  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setProfileLoading(true);
    try {
      await apiRequest("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ displayName: displayName.trim() }),
      });
      await refetch();
      setProfileSaved(true);
      showSuccess(t("profileSaved"));
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) {
      showError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      showError(t("fillAllFields"));
      return;
    }
    if (newPw !== confirmPw) {
      showError(t("passwordMismatch"));
      return;
    }
    if (newPw.length < 8) {
      showError(t("passwordTooShort"));
      return;
    }
    setPwLoading(true);
    try {
      await apiRequest("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ old_password: oldPw, new_password: newPw }),
      });
      showSuccess(t("passwordChanged"));
      setOldPw(""); setNewPw(""); setConfirmPw("");
      setPwOpen(false);
    } catch (e) {
      showError(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setPwLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const switchLocale = (next: "th" | "en") => {
    if (next === locale) return;
    startLocaleTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  /* ── render ── */
  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {/* ── SECTION: Profile ── */}
      <Section icon={User} title={t("profile")} subtitle={t("profileSub")}>
        {/* Avatar + role badges */}
        <div className="flex items-center gap-4 pb-2">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold select-none">
            {initials(session?.displayName ?? user?.role)}
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold text-foreground">
              {session?.displayName ?? "—"}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {session?.roles.map((r) => (
                <span
                  key={r}
                  className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary"
                >
                  {ROLE_LABELS[r] ?? r}
                </span>
              ))}
              {user?.tier && (
                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                  {TIER_LABELS[user.tier] ?? user.tier}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-4 space-y-3">
          <Field label={t("displayName")}>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("displayNamePlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[44px]"
            />
          </Field>

          {session?.userId && (
            <Field label={t("userId")}>
              <p className="text-sm text-muted-foreground font-mono select-all">
                {session.userId}
              </p>
            </Field>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={profileLoading || !displayName.trim()}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all min-h-[44px] active:scale-95",
                profileSaved
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-primary hover:bg-primary/90 disabled:opacity-50"
              )}
            >
              {profileSaved ? (
                <><Check className="size-4" /> {t("saved")}</>
              ) : profileLoading ? (
                t("saving")
              ) : (
                t("saveProfile")
              )}
            </button>
          </div>
        </div>
      </Section>

      {/* ── SECTION: General ── */}
      <Section icon={Globe} title={t("general")} subtitle={t("generalSub")}>
        <Field label={t("language")}>
          <div className="flex gap-2">
            {LOCALES.map(({ code, label, flag }) => (
              <button
                key={code}
                type="button"
                disabled={localePending}
                onClick={() => switchLocale(code)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors min-h-[44px] active:scale-95",
                  locale === code
                    ? "border-primary bg-primary/10 text-primary font-semibold"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                <span aria-hidden>{flag}</span>
                {label}
                {locale === code && <Check className="size-3.5 ml-0.5" />}
              </button>
            ))}
          </div>
        </Field>

        {user?.shopName && (
          <Field label={t("currentShop")}>
            <p className="text-sm font-medium text-foreground">{user.shopName}</p>
          </Field>
        )}
      </Section>

      {/* ── SECTION: Security ── */}
      <Section icon={ShieldCheck} title={t("security")} subtitle={t("securitySub")}>
        {/* change password collapsible */}
        <button
          type="button"
          onClick={() => setPwOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted min-h-[48px]"
        >
          <div className="flex items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            {t("changePassword")}
          </div>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", pwOpen && "rotate-180")} />
        </button>

        {pwOpen && (
          <div className="rounded-lg border border-border bg-background p-4 space-y-3">
            <Field label={t("oldPassword")}>
              <PasswordInput value={oldPw} onChange={setOldPw} placeholder="••••••••" />
            </Field>
            <Field label={t("newPassword")}>
              <PasswordInput value={newPw} onChange={setNewPw} placeholder={t("minChars")} />
            </Field>
            <Field label={t("confirmPassword")}>
              <PasswordInput value={confirmPw} onChange={setConfirmPw} placeholder="••••••••" />
            </Field>
            {newPw && confirmPw && newPw !== confirmPw && (
              <p className="text-xs text-red-600">{t("passwordMismatch")}</p>
            )}
            <button
              type="button"
              onClick={handleChangePassword}
              disabled={pwLoading || !oldPw || !newPw || !confirmPw}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all active:scale-95 hover:bg-primary/90 disabled:opacity-50 min-h-[44px]"
            >
              {pwLoading ? t("saving") : t("confirmChange")}
            </button>
          </div>
        )}

        {/* logout */}
        <div className="border-t border-border pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 active:scale-95 min-h-[48px]"
          >
            <LogOut className="size-4" />
            {t("logout")}
          </button>
        </div>
      </Section>
    </div>
  );
}
