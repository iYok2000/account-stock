"use client";

import { useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { usePermissions } from "@/contexts/AuthContext";
import { NAV_PERMISSIONS } from "@/lib/rbac/constants";

const navPaths = [
  { href: "/", key: "dashboard", emoji: "🏠" },
  { href: "/inventory", key: "inventory", emoji: "📦" },
  { href: "/orders", key: "orders", emoji: "📋" },
  { href: "/suppliers", key: "suppliers", emoji: "👥" },
  { href: "/reports", key: "reports", emoji: "📊" },
] as const;

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  isMobile: boolean;
};

export default function Sidebar({ open, onClose, isMobile }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const locale = useLocale();
  const { can } = usePermissions();

  const visibleNavPaths = useMemo(
    () =>
      navPaths.filter((p) => {
        const perm = NAV_PERMISSIONS[p.href as keyof typeof NAV_PERMISSIONS];
        return perm ? can(perm) : true;
      }),
    [can]
  );

  useEffect(() => {
    if (!isMobile) return;
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, open]);

  // Mobile: overlay drawer (ทับ content)
  if (isMobile) {
    return (
      <>
        <div
          className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 md:hidden ${
            open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
          }`}
          aria-hidden="true"
          onClick={onClose}
        />
        <aside
          className={`fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-neutral-200 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Main navigation"
        >
          {renderSidebarContent(true)}
        </aside>
      </>
    );
  }

  // Desktop: sidebar ปกติ (ใน flow, ดัน content — ไม่ใช่ drawer)
  return (
    <aside
      className={`hidden md:flex md:h-full md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:bg-white md:transition-all md:duration-200 ${
        open ? "md:w-[280px]" : "md:w-0 md:border-0 md:overflow-hidden"
      }`}
      aria-label="Main navigation"
    >
      {open ? (
        <div className="flex h-full w-[280px] flex-col">
          {renderSidebarContent(false)}
        </div>
      ) : null}
    </aside>
  );

  function renderSidebarContent(showBrand: boolean) {
    return (
      <>
        {/* Sidebar header — ขนาดและ style ตาม reference (icon + title, compact) */}
        <div className="flex min-h-14 items-center justify-between border-b border-neutral-200 px-4 py-3 md:min-h-[52px] md:px-5 md:py-3.5">
          <div className="flex items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600 md:size-8" aria-hidden="true">
              <svg className="size-5 md:size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </span>
            {showBrand ? (
              <span className="text-base font-bold tracking-tight text-neutral-900 md:text-lg">
                {t("brand")}
              </span>
            ) : (
              <span className="text-sm font-semibold text-neutral-700 md:text-base">{t("menu")}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-neutral-500 transition-all hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
            aria-label="Close menu"
          >
            {isMobile ? (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        {/* ระยะซ้าย: nav pl-4 + link paddingLeft = ไอคอนห่างจากขอบ (เทียบเว็บทั่วไป ~24–32px) */}
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto py-6 pl-4 pr-3 md:pl-5 md:pr-4">
          {visibleNavPaths.map(({ href, key, emoji }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex min-h-12 items-center gap-4 rounded-lg py-4 pr-4 text-base font-medium leading-tight transition-all duration-150 md:min-h-[52px] md:py-5 md:pr-5 md:text-[17px] ${
                  isActive
                    ? "nav-active"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
                style={{ paddingLeft: "1.5rem" }}
              >
                <span className="shrink-0 text-2xl leading-none" role="img" aria-hidden="true">{emoji}</span>
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </nav>

        {/* ปุ่มภาษา + Role — style ตาม reference (compact, ขนาดปุ่มเท่ากัน) */}
        <div className="border-t border-neutral-200 p-3 md:p-4">
          <div className="mb-2.5 flex gap-1.5 rounded-lg bg-neutral-50 p-1.5 md:mb-3 md:p-2">
            {routing.locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={`min-h-9 flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors md:min-h-[38px] md:py-2.5 md:text-[15px] ${
                  locale === loc
                    ? "bg-primary text-white shadow-sm"
                    : "text-neutral-600 hover:bg-neutral-200/80 hover:text-neutral-900"
                }`}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
          <p className="text-xs font-medium text-neutral-500 md:text-[13px]">{t("role")}</p>
        </div>
      </>
    );
  }
}
