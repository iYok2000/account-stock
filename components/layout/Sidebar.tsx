"use client";

import { useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const navPaths = [
  { 
    href: "/", 
    key: "dashboard",
    icon: (
      <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: "/inventory", 
    key: "inventory",
    icon: (
      <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    )
  },
  { 
    href: "/orders", 
    key: "orders",
    icon: (
      <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  { 
    href: "/suppliers", 
    key: "suppliers",
    icon: (
      <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    href: "/reports", 
    key: "reports",
    icon: (
      <svg className="size-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Mobile: overlay sidebar
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        <div
          className={`fixed inset-0 z-40 bg-black/20 transition-opacity duration-200 md:hidden ${
            open ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
          }`}
          aria-hidden="true"
        />

        {/* Sidebar panel - Mobile */}
        <aside
          className={`fixed left-0 top-0 z-50 flex h-full w-[280px] max-w-[85vw] flex-col border-r border-neutral-200 bg-white shadow-xl transition-transform duration-200 ease-out md:hidden ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Main navigation"
        >
          {renderSidebarContent()}
        </aside>
      </>
    );
  }

  // Desktop: collapsible sidebar (sticky top-0, full viewport height)
  return (
    <aside
      className={`hidden md:flex md:h-screen md:shrink-0 md:flex-col md:border-r md:border-neutral-200 md:bg-white md:sticky md:top-0 md:transition-all md:duration-200 ${
        open ? "md:w-[280px]" : "md:w-0 md:border-0"
      }`}
      aria-label="Main navigation"
    >
      <div className={open ? "block" : "hidden"}>
        {renderSidebarContent()}
      </div>
    </aside>
  );

  function renderSidebarContent() {
    return (
      <>
        <div className="flex min-h-16 items-center justify-between border-b border-neutral-200 px-5 py-4">
          <span className="text-lg font-semibold tracking-tight text-neutral-900">
            {t("brand")}
          </span>
          {/* ปุ่มปิด - แสดงทั้ง desktop และ mobile */}
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            aria-label="Close menu"
          >
            {isMobile ? (
              // Mobile: X icon
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              // Desktop: Chevron left icon
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            )}
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-4">
          {navPaths.map(({ href, key, icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-4 rounded-lg px-4 py-3.5 text-[15px] font-medium leading-tight transition-all duration-150 ${
                  isActive
                    ? "nav-active"
                    : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {icon}
                <span>{t(key)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-neutral-200 p-4">
          <div className="mb-3 flex gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1">
            {routing.locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={`flex-1 rounded px-3 py-1.5 text-center text-xs font-medium transition-colors md:text-sm ${
                  locale === loc
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
          <p className="text-xs text-neutral-500">{t("role")}</p>
        </div>
      </>
    );
  }
}
