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
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-16 max-w-[1280px] items-center gap-4 px-4 py-4 md:gap-6 md:px-6 md:py-5 lg:px-10">
        {/* Hamburger + Logo */}
        <div className="flex shrink-0 items-center gap-3 md:gap-4">
          {/* Hamburger - แสดงเฉพาะตอน sidebar ปิด */}
          {!sidebarOpen && (
            <button
              type="button"
              onClick={onMenuClick}
              className="flex size-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              aria-expanded={sidebarOpen}
              aria-label="Open menu"
            >
              <svg
                className="size-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          )}
          <Link
            href="/"
            className="text-lg font-semibold tracking-tight text-neutral-900 transition-colors hover:text-primary md:text-xl"
          >
            {t("brand")}
          </Link>
        </div>

        {/* Right: Language + Role */}
        <div className="ml-auto flex shrink-0 items-center gap-3 md:gap-4">
          <div className="flex gap-1 rounded-md border border-neutral-200 bg-neutral-50 p-1">
            {routing.locales.map((loc) => (
              <Link
                key={loc}
                href={pathname}
                locale={loc}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors md:px-3 md:text-sm ${
                  locale === loc
                    ? "bg-primary text-white"
                    : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                }`}
              >
                {loc.toUpperCase()}
              </Link>
            ))}
          </div>
          <span className="hidden text-sm text-neutral-500 lg:inline">
            {t("role")}
          </span>
        </div>
      </div>
    </header>
  );
}
