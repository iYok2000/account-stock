"use client";

import { useMemo, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { CommandPalette } from "./CommandPalette";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { useAuth, usePermissions } from "@/contexts/AuthContext";
import { NAV_PERMISSIONS } from "@/lib/rbac/constants";
import { useAuthRedirect } from "@/components/auth/useAuthRedirect";

export default function LayoutWithSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const { can } = usePermissions();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isLoginPage = pathname === "/login";

  // Centralized route permission guard — redirect to home when missing permission
  const requiredPermission = useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);
    const normalizedPath = segments.length === 1 ? "/" : pathname;
    const match = Object.keys(NAV_PERMISSIONS).find((href) =>
      normalizedPath === href || normalizedPath.endsWith(href)
    );
    return match ? NAV_PERMISSIONS[match as keyof typeof NAV_PERMISSIONS] : null;
  }, [pathname]);

  const redirectTo = !isLoginPage && !isLoading && session && requiredPermission && !can(requiredPermission)
    ? "/"
    : null;
  useAuthRedirect(redirectTo);

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
