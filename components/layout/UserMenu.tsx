"use client";

import { useState, useRef, useEffect } from "react";
import { User, LogOut } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";

export function UserMenu() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { session, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", onOutside);
    return () => document.removeEventListener("click", onOutside);
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    router.replace("/login");
  };

  if (!session) {
    return (
      <Link
        href="/login"
        className="-m-1.5 flex items-center gap-x-2 p-1.5 rounded-md hover:bg-muted transition-colors"
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <User className="size-4 text-primary" aria-hidden />
        </div>
        <span className="hidden text-sm font-medium text-foreground lg:block">
          {t("login")}
        </span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="-m-1.5 flex items-center gap-x-2 p-1.5 rounded-md hover:bg-muted transition-colors"
        aria-label={t("userMenu")}
        aria-expanded={open}
      >
        <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
          <User className="size-4 text-primary" aria-hidden />
        </div>
        <span className="hidden text-sm font-medium text-foreground lg:block">
          {session.displayName ?? session.roles?.[0] ?? t("user")}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-border bg-card py-2 shadow-lg z-50">
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground truncate">
              {session.displayName ?? session.roles?.[0]}
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-foreground hover:bg-muted"
            >
              <LogOut className="size-4" />
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
