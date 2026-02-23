"use client";

import { useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";
import { RequireAuth } from "@/components/auth/RequireAuth";

export default function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <RequireAuth>
        <div className="min-h-screen bg-muted/20">{children}</div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div>
        <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <div className="lg:pl-[280px]">
          <Header onMenuClick={() => setMobileOpen(true)} />
          <main className="min-h-screen bg-muted/20 py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
        <CommandPalette />
      </div>
    </RequireAuth>
  );
}
