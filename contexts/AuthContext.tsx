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
import { apiRequest, setAuthToken, setOnUnauthorized } from "@/lib/api-client";
import type { MeResponseApi } from "@/types/api/auth";
import { env } from "@/lib/env";

type AuthContextValue = {
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  /** Dev/test: login with env credentials → SuperAdmin. Frontend-only; do not use in production. */
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const MOCK_ROLE_KEY = "rbac_mock_role";
const SESSION_CACHE_KEY = "rbac_session";
const AUTH_LOGGED_OUT_KEY = "auth_logged_out";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min; refetch after

const ALL_ROLES: Role[] = ["SuperAdmin", "Admin", "Manager", "Staff", "Viewer"];

function getMockRole(): Role {
  if (typeof window === "undefined") return "Staff";
  const stored = sessionStorage.getItem(MOCK_ROLE_KEY);
  if (stored && ALL_ROLES.includes(stored as Role)) return stored as Role;
  const envRole = env().NEXT_PUBLIC_MOCK_ROLE;
  return (ALL_ROLES.includes(envRole as Role) ? envRole : "Staff") as Role;
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
      const data = await apiRequest<MeResponseApi>("/api/auth/me");
      const roles = (data.roles ?? []) as Role[];
      const permissions = (data.permissions ?? []) as PermissionString[];
      const session: UserSession = {
        userId: data.user?.id ?? "unknown",
        roles,
        permissions,
        displayName: data.user?.displayName,
        tier: (data.tier === "paid" ? "paid" : "free") as UserSession["tier"],
        companyId: data.company_id ?? undefined,
      };
      setSession(session);
      saveCachedSession(session);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Auth failed";
      setError(msg);
      // No backend or 401: use mock for dev unless user explicitly logged out
      if (typeof window !== "undefined" && sessionStorage.getItem(AUTH_LOGGED_OUT_KEY)) {
        setSession(null);
      } else {
        const roles: Role[] = [getMockRole()];
        const permissions = getPermissionsForRoles(roles);
        const mock: UserSession = {
          userId: "mock",
          roles,
          permissions,
          displayName: `Mock ${roles[0]}`,
          tier: "free",
          companyId: "default",
        };
        setSession(mock);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (emailOrUsername: string, password: string): Promise<boolean> => {
    // Dev/test only — ปิดใน production build
    if (typeof process !== "undefined" && process.env.NODE_ENV === "production") return false;
    const { NEXT_PUBLIC_TEST_USER: envUser, NEXT_PUBLIC_TEST_PASS: envPass } = env();
    const input = emailOrUsername.trim();
    if (input !== envUser || password !== envPass) return false;
    if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
    const roles: Role[] = ["SuperAdmin"];
    const permissions = getPermissionsForRoles(roles);
    const newSession: UserSession = {
      userId: "test",
      roles,
      permissions,
      displayName: "SuperAdmin",
      tier: "free",
      companyId: "default",
    };
    setSession(newSession);
    saveCachedSession(newSession);
    return true;
  }, []);

  const logout = useCallback(() => {
    setAuthToken(null);
    setSession(null);
    setError(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      sessionStorage.removeItem(MOCK_ROLE_KEY);
      sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, "1");
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => setSession(null));
    return () => setOnUnauthorized(null);
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
    () => ({ session, isLoading, error, refetch: fetchSession, login, logout }),
    [session, isLoading, error, fetchSession, login, logout]
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

/** User context from store (USER_SPEC: role, tier, company). Use with HOC or pages. */
export type UserContextValue = {
  userId: string;
  role: Role;
  roles: Role[];
  tier: "free" | "paid";
  companyId: string | undefined;
  displayName: string | undefined;
  permissions: PermissionString[];
};

export function useUserContext(): UserContextValue | null {
  const { session } = useAuth();
  return useMemo(() => {
    if (!session) return null;
    const role = session.roles[0] ?? "Viewer";
    return {
      userId: session.userId,
      role,
      roles: session.roles,
      tier: session.tier ?? "free",
      companyId: session.companyId,
      displayName: session.displayName,
      permissions: session.permissions ?? [],
    };
  }, [session]);
}
