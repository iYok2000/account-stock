"use client";

import { useAuth, usePermissions } from "@/contexts/AuthContext";
import { useAuthRedirect } from "./useAuthRedirect";
import type { PermissionString } from "@/lib/rbac/constants";

/**
 * Renders children only when the user is authenticated and has the given permission.
 * If not authenticated, redirects to /login. If authenticated but no permission, redirects to /.
 * Use with RequireAuth at layout; this HOC adds permission check (e.g. users:read for Users page).
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: PermissionString;
  children: React.ReactNode;
}) {
  const { session, isLoading } = useAuth();
  const { can } = usePermissions();

  const redirectTo = !isLoading
    ? !session
      ? "/login"
      : !can(permission)
        ? "/"
        : null
    : null;
  useAuthRedirect(redirectTo);

  if (isLoading || !session) return null;
  if (!can(permission)) return null;
  return <>{children}</>;
}
