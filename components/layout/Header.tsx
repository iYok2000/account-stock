"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type HeaderProps = {
  onMenuClick: () => void;
  sidebarOpen: boolean;
};

export default function Header({ onMenuClick, sidebarOpen }: HeaderProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/95 shadow-sm backdrop-blur-sm">
      <div
        className="mx-auto flex h-16 max-w-[1280px] items-center justify-between md:h-[72px]"
        style={{ paddingLeft: "1rem", paddingRight: "1rem" }}
      >
        {/* Left: Hamburger + Logo — ระยะห่างใช้ inline style ให้แน่นอน */}
        <div className="flex shrink-0 items-center" style={{ gap: "1rem" }}>
          {!sidebarOpen && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex size-10 items-center justify-center rounded-lg text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-900 active:scale-95"
              aria-expanded={sidebarOpen}
              aria-label="Open menu"
            >
              <svg className="size-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-neutral-900 transition-colors hover:text-primary md:text-xl"
          >
            {t("brand")}
          </Link>
        </div>

        {/* Right: Language + Role — padding ใช้ inline style ให้แน่นอน */}
        <div className="flex shrink-0 items-center" style={{ gap: "1rem" }}>
          <div
            className="flex rounded-lg border border-neutral-200 bg-neutral-50"
            style={{ gap: "4px", padding: "4px" }}
          >
            {routing.locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={`rounded-md text-xs font-semibold transition-all md:text-sm ${
                  locale === loc
                    ? "bg-primary text-white shadow-sm"
                    : "text-neutral-600 hover:bg-white hover:text-neutral-900 hover:shadow-sm"
                }`}
                style={{ paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.375rem", paddingBottom: "0.375rem" }}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
          <div
            className="hidden items-center rounded-lg border border-neutral-200 bg-neutral-50 lg:flex"
            style={{ gap: "0.5rem", paddingLeft: "0.75rem", paddingRight: "0.75rem", paddingTop: "0.5rem", paddingBottom: "0.5rem" }}
          >
            <svg className="size-4 shrink-0 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-medium text-neutral-700">{t("role")}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
