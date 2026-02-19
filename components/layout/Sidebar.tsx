"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Upload,
  Users,
  Calculator,
  FileText,
  Store,
  Megaphone,
  Ticket,
  BadgePercent,
  Receipt,
  GitBranch,
  Bot,
  Settings,
  X,
} from "lucide-react";
import { usePermissions } from "@/contexts/AuthContext";
import { NAV_PERMISSIONS } from "@/lib/rbac/constants";

const NAV_GROUPS = [
  {
    label: null,
    items: [
      { href: "/", key: "dashboard", icon: LayoutDashboard },
      { href: "/inventory", key: "inventory", icon: Package },
      { href: "/orders", key: "orders", icon: ShoppingCart },
      { href: "/suppliers", key: "suppliers", icon: Users },
      { href: "/import", key: "import", icon: Upload },
      { href: "/shops", key: "shops", icon: Store },
    ],
  },
  {
    label: "โปรโมชั่น",
    items: [
      { href: "/campaigns", key: "campaigns", icon: Megaphone },
      { href: "/vouchers", key: "vouchers", icon: Ticket },
      { href: "/fees", key: "fees", icon: BadgePercent },
    ],
  },
  {
    label: "วิเคราะห์",
    items: [
      { href: "/calculator", key: "calculator", icon: Calculator },
      { href: "/tax", key: "tax", icon: Receipt },
      { href: "/funnels", key: "funnels", icon: GitBranch },
      { href: "/reports", key: "reports", icon: FileText },
    ],
  },
  {
    label: "เครื่องมือ",
    items: [
      { href: "/agents", key: "agents", icon: Bot },
      { href: "/settings", key: "settings", icon: Settings },
    ],
  },
] as const;

// Flatten for RBAC filtering convenience
type NavItem = { href: string; key: string; icon: React.ElementType };
const navigation: NavItem[] = NAV_GROUPS.flatMap((g) => [...g.items]);

interface SidebarProps {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { can } = usePermissions();

  const canSee = useMemo(
    () =>
      new Set(
        navigation
          .filter((item) => {
            const perm = NAV_PERMISSIONS[item.href as keyof typeof NAV_PERMISSIONS];
            return perm ? can(perm) : true;
          })
          .map((item) => item.href)
      ),
    [can]
  );

  const renderLink = (item: NavItem) => {
    if (!canSee.has(item.href)) return null;
    const isActive =
      pathname === item.href ||
      (item.href !== "/" && pathname.startsWith(item.href));
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "group flex min-h-10 items-center gap-x-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <item.icon
            className={cn(
              "h-5 w-5 shrink-0",
              isActive
                ? "text-primary"
                : "text-muted-foreground group-hover:text-foreground"
            )}
          />
          <span className="truncate">{t(item.key)}</span>
        </Link>
      </li>
    );
  };

  const navContent = (
    <div className="flex grow flex-col overflow-y-auto border-r border-border bg-card pb-4">
      {/* Logo row — same height as header (h-16) */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border px-6">
        <Package className="h-8 w-8 shrink-0 text-primary" />
        <div className="min-w-0">
          <h1 className="text-base font-bold leading-tight text-foreground">
            {t("brand")}
          </h1>
          <p className="text-xs leading-tight text-muted-foreground">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Navigation groups */}
      <nav className="flex flex-1 flex-col gap-y-4 px-4 pt-4">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((item) => canSee.has(item.href));
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label ?? "__main"}>
              {group.label && (
                <p className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group.label}
                </p>
              )}
              <ul role="list" className="flex flex-col gap-y-0.5">
                {visibleItems.map((item) => renderLink(item as NavItem))}
              </ul>
            </div>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <div className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col shadow-xl">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="ปิดเมนู"
            >
              <X className="size-5" />
            </button>
            {navContent}
          </div>
        </div>
      )}

      {/* Desktop sidebar — fixed, full height */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        {navContent}
      </aside>
    </>
  );
}
