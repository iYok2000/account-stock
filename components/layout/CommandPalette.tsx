"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Search, LayoutDashboard, Package, ShoppingCart, Upload,
  Users, Store, Megaphone, Ticket, BadgePercent, Calculator,
  Receipt, GitBranch, FileText, Bot, Settings,
} from "lucide-react";

// Must mirror NAV_GROUPS in Sidebar.tsx
const NAV_ITEMS = [
  { group: "หลัก", href: "/", key: "dashboard", icon: LayoutDashboard },
  { group: "หลัก", href: "/inventory", key: "inventory", icon: Package },
  { group: "หลัก", href: "/orders", key: "orders", icon: ShoppingCart },
  { group: "หลัก", href: "/suppliers", key: "suppliers", icon: Users },
  { group: "หลัก", href: "/import", key: "import", icon: Upload },
  { group: "หลัก", href: "/shops", key: "shops", icon: Store },
  { group: "โปรโมชั่น", href: "/campaigns", key: "campaigns", icon: Megaphone },
  { group: "โปรโมชั่น", href: "/vouchers", key: "vouchers", icon: Ticket },
  { group: "โปรโมชั่น", href: "/fees", key: "fees", icon: BadgePercent },
  { group: "วิเคราะห์", href: "/calculator", key: "calculator", icon: Calculator },
  { group: "วิเคราะห์", href: "/tax", key: "tax", icon: Receipt },
  { group: "วิเคราะห์", href: "/funnels", key: "funnels", icon: GitBranch },
  { group: "วิเคราะห์", href: "/reports", key: "reports", icon: FileText },
  { group: "เครื่องมือ", href: "/agents", key: "agents", icon: Bot },
  { group: "เครื่องมือ", href: "/settings", key: "settings", icon: Settings },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]["key"];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const t = useTranslations("nav");

  // Build translated items once
  const allItems = NAV_ITEMS.map((item) => ({
    ...item,
    label: t(item.key as NavKey),
  }));

  // Filtered results
  const filtered =
    query.trim() === ""
      ? allItems
      : allItems.filter(
          (item) =>
            item.label.toLowerCase().includes(query.toLowerCase()) ||
            item.key.toLowerCase().includes(query.toLowerCase()) ||
            item.group.toLowerCase().includes(query.toLowerCase())
        );

  const openPalette = useCallback(() => {
    setOpen(true);
    setQuery("");
    setSelectedIdx(0);
  }, []);

  const closePalette = useCallback(() => setOpen(false), []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      closePalette();
    },
    [router, closePalette]
  );

  // Global Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
        setQuery("");
        setSelectedIdx(0);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Custom event from Header search button
  useEffect(() => {
    document.addEventListener("open-command-palette", openPalette);
    return () => document.removeEventListener("open-command-palette", openPalette);
  }, [openPalette]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [open]);

  // Arrow key + Enter navigation within palette
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closePalette();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        const item = filtered[selectedIdx];
        if (item) navigate(item.href);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIdx, navigate, closePalette]);

  // Auto-scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  // Reset selection when query changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  if (!open) return null;

  // Group filtered results for display
  const groups = filtered.reduce<Record<string, typeof filtered>>((acc, item) => {
    (acc[item.group] ??= []).push(item);
    return acc;
  }, {});

  let globalIdx = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={closePalette}
        aria-hidden
      />

      {/* Panel */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาเมนู..."
            className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="max-h-[360px] overflow-y-auto py-1"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ไม่พบผลลัพธ์สำหรับ &ldquo;{query}&rdquo;
            </p>
          ) : (
            Object.entries(groups).map(([groupName, items]) => (
              <div key={groupName}>
                {/* Group label */}
                <p className="px-4 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {groupName}
                </p>
                {items.map((item) => {
                  const idx = globalIdx++;
                  const isSelected = idx === selectedIdx;
                  return (
                    <button
                      key={item.href}
                      data-idx={idx}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => navigate(item.href)}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left",
                        isSelected
                          ? "bg-primary/10 text-primary"
                          : "text-foreground hover:bg-muted"
                      )}
                    >
                      <item.icon
                        className={cn("h-4 w-4 shrink-0", isSelected ? "text-primary" : "text-muted-foreground")}
                      />
                      <span className="flex-1">{item.label}</span>
                      {isSelected && (
                        <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          ↵
                        </kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 border-t border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5">↑↓</kbd>
            เลื่อน
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5">↵</kbd>
            เลือก
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5">ESC</kbd>
            ปิด
          </span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5">⌘K</kbd>
            เปิด/ปิด
          </span>
        </div>
      </div>
    </div>
  );
}
