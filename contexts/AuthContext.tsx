"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useEffect,
} from "react";
import type { UserSession, Role } from "@/lib/rbac/types";
import type { PermissionString } from "@/lib/rbac/constants";
import { getPermissionsForRoles } from "@/lib/rbac/role-permissions";

type AuthContextValue = {
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_ROLE_KEY = "rbac_mock_role";
const SESSION_CACHE_KEY = "rbac_session";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min; refetch after

function getMockRole(): Role {
  if (typeof window === "undefined") return "Staff";
  const stored = sessionStorage.getItem(MOCK_ROLE_KEY);
  if (stored && ["Admin", "Manager", "Staff", "Viewer"].includes(stored))
    return stored as Role;
  return (process.env.NEXT_PUBLIC_MOCK_ROLE as Role) || "Staff";
}

function loadCachedSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const { session, ts } = JSON.parse(raw) as {
      session: UserSession;
      ts: number;
    };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return session;
  } catch {
    return null;
  }
}

function saveCachedSession(session: UserSession) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify({ session, ts: Date.now() })
    );
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Prefer backend; fallback to mock (security: backend must enforce all checks)
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = await res.json();
        const session: UserSession = {
          userId: data.user?.id ?? "unknown",
          roles: data.roles ?? [],
          permissions: data.permissions ?? [],
          displayName: data.user?.displayName,
        };
        setSession(session);
        saveCachedSession(session);
        return;
      }
      // No backend or 401: use mock for dev (do not cache long-term)
      const roles: Role[] = [getMockRole()];
      const permissions = getPermissionsForRoles(roles);
      const mock: UserSession = {
        userId: "mock",
        roles,
        permissions,
        displayName: `Mock ${roles[0]}`,
      };
      setSession(mock);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auth failed";
      setError(msg);
      const roles: Role[] = [getMockRole()];
      setSession({
        userId: "mock",
        roles,
        permissions: getPermissionsForRoles(roles),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const cached = loadCachedSession();
    if (cached) {
      setSession(cached);
      setIsLoading(false);
      return;
    }
    void fetchSession();
  }, [fetchSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isLoading, error, refetch: fetchSession }),
    [session, isLoading, error, fetchSession]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Memoized permission checks (O(1)); use for UI only — backend must enforce. */
export function usePermissions() {
  const { session } = useAuth();
  const permSet = useMemo(
    () => new Set<PermissionString>(session?.permissions ?? []),
    [session?.permissions]
  );

  const can = useCallback(
    (permission: PermissionString) => permSet.has(permission),
    [permSet]
  );

  const canAny = useCallback(
    (permissions: PermissionString[]) =>
      permissions.some((p) => permSet.has(p)),
    [permSet]
  );

  const canAll = useCallback(
    (permissions: PermissionString[]) =>
      permissions.every((p) => permSet.has(p)),
    [permSet]
  );

  return useMemo(
    () => ({ can, canAny, canAll, permissions: session?.permissions ?? [] }),
    [can, canAny, canAll, session?.permissions]
  );
}
