"use client";

import { useTranslations } from "next-intl";
import { Eye, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuth, type RoleView, ROLE_VIEW_LABELS } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const ROLE_VIEW_OPTIONS: { value: RoleView; icon: string }[] = [
  { value: "owner", icon: "🏪" },
  { value: "affiliate", icon: "🔗" },
  { value: "root", icon: "⚙️" },
];

export function RoleViewSwitcher() {
  const t = useTranslations("auth");
  const { session, roleView, setRoleView } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isRoot = session?.roles.includes("Root") ?? false;
  const isViewingAs = roleView !== "root";

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  // เฉพาะ Root เท่านั้น
  if (!isRoot) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t("roleViewTitle")}
        className={cn(
          "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors min-h-[32px] border",
          isViewingAs
            ? "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100"
            : "bg-muted border-border text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Eye className="h-3.5 w-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {isViewingAs ? `${t("viewingAs")} ${ROLE_VIEW_LABELS[roleView]}` : t("rootView")}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-52 rounded-xl border border-border bg-card shadow-lg z-50 overflow-hidden">
          <div className="px-3 pt-2.5 pb-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("roleViewTitle")}
            </p>
          </div>
          <div className="py-1">
            {ROLE_VIEW_OPTIONS.map(({ value, icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setRoleView(value); setOpen(false); }}
                className={cn(
                  "flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors",
                  roleView === value
                    ? "bg-primary/8 text-primary font-semibold"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <span className="text-base w-5 text-center">{icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium leading-none">{ROLE_VIEW_LABELS[value]}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {value === "root" ? t("roleViewDescRoot")
                      : value === "owner" ? t("roleViewDescOwner")
                      : t("roleViewDescAffiliate")}
                  </p>
                </div>
                {roleView === value && (
                  <span className="text-xs text-primary">✓</span>
                )}
              </button>
            ))}
          </div>
          {isViewingAs && (
            <div className="border-t border-border px-3 py-2">
              <p className="text-[10px] text-amber-700 bg-amber-50 rounded-md px-2 py-1.5">
                {t("roleViewWarning")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
