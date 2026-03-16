"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useAuthRedirect } from "./useAuthRedirect";

/**
 * Renders children only when the user is NOT authenticated (guest).
 * If authenticated, redirects to home. Use for login page.
 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();

  const redirectTo = !isLoading && session ? "/" : null;
  useAuthRedirect(redirectTo);

  if (isLoading || session) return null;
  return <>{children}</>;
}
