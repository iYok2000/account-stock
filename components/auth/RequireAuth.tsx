"use client";

import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "./useAuthRedirect";

/**
 * Renders children only when the user is authenticated.
 * If not authenticated and not on login page, redirects to /login.
 * Use for app shell (sidebar + main content).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { session, isLoading } = useAuth();
  const isLoginPage = pathname === "/login";

  const redirectTo =
    !isLoading && !isLoginPage && !session ? "/login" : null;
  useAuthRedirect(redirectTo);

  if (isLoginPage) return <>{children}</>;
  if (!session) return null;
  return <>{children}</>;
}
