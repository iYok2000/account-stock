"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";

/**
 * Performs a single redirect when `redirectTo` is set.
 * Use from RequireAuth / RequireGuest / RequirePermission to centralize redirect behavior.
 */
export function useAuthRedirect(redirectTo: string | null) {
  const router = useRouter();

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);
}
