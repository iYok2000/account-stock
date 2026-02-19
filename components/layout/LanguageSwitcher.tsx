"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "th", label: "ไทย", flag: "🇹🇭" },
  { code: "en", label: "EN", flag: "🇬🇧" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];

export function LanguageSwitcher() {
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: LocaleCode) => {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      className="flex items-center rounded-md border border-border bg-muted/50 p-0.5 gap-0.5"
      aria-label="เปลี่ยนภาษา"
    >
      {LOCALES.map(({ code, label, flag }) => (
        <button
          key={code}
          type="button"
          disabled={isPending}
          onClick={() => switchLocale(code)}
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors",
            locale === code
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <span aria-hidden>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
