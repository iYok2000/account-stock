"use client";

import { Bell, Menu, User, Search } from "lucide-react";
import AppSwitcher from "../AppSwitcher";
import { LanguageSwitcher } from "./LanguageSwitcher";

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-card px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Mobile: hamburger to open sidebar */}
      <button
        type="button"
        onClick={onMenuClick}
        className="-m-2.5 p-2.5 text-muted-foreground transition-colors hover:text-foreground lg:hidden"
        aria-label="เปิดเมนู"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {/* Mobile separator */}
      <div className="h-6 w-px bg-border lg:hidden" aria-hidden />

      {/* Right-side actions — pushed to the right */}
      <div className="flex flex-1 items-center justify-end gap-x-3 sm:gap-x-4 lg:gap-x-6">
        {/* ⌘K search trigger */}
        <button
          type="button"
          onClick={() => document.dispatchEvent(new Event("open-command-palette"))}
          className="hidden sm:flex items-center gap-2 rounded-md border border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted"
          aria-label="ค้นหา"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline">ค้นหาเมนู...</span>
          <kbd className="hidden md:inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 text-[10px] font-medium">
            ⌘K
          </kbd>
        </button>

        <AppSwitcher />

        <LanguageSwitcher />

        <button
          type="button"
          className="relative -m-2.5 p-2.5 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="size-5" aria-hidden />
        </button>

        <div className="hidden h-6 w-px bg-border lg:block" aria-hidden />

        <button
          type="button"
          className="-m-1.5 flex items-center gap-x-2 p-1.5"
        >
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10">
            <User className="size-4 text-primary" aria-hidden />
          </div>
          <span className="hidden text-sm font-medium text-foreground lg:block">
            ผู้ใช้
          </span>
        </button>
      </div>
    </header>
  );
}
