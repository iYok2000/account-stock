"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Renders children only when the user is authenticated.
 * If not authenticated and not on login page, redirects to /login.
 * Use for app shell (sidebar + main content).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, isLoading } = useAuth();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoading) return;
    if (isLoginPage) return;
    if (!session) {
      router.replace("/login");
    }
  }, [session, isLoading, isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;
  if (!session) return null;
  return <>{children}</>;
}
