"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Renders children only when the user is NOT authenticated (guest).
 * If authenticated, redirects to home. Use for login page.
 */
export function RequireGuest({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (session) {
      router.replace("/");
    }
  }, [session, isLoading, router]);

  if (isLoading || session) return null;
  return <>{children}</>;
}
