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
import { ROLE_PERMISSIONS, getPermissionsForRoles } from "@/lib/rbac/role-permissions";
import { apiRequest, setAuthToken, setOnUnauthorized } from "@/lib/api-client";
import type { MeResponseApi } from "@/types/api/auth";

/** "need_confirm" = credentials match Root; show confirm code field and call login again with code. */
export type LoginResult = boolean | "need_confirm";

/**
 * roleView — เฉพาะ Root เท่านั้นที่ใช้
 * "root"      = มุมมองปกติ (full Root permissions)
 * "owner"     = มุมมอง SuperAdmin (เจ้าของร้าน)
 * "affiliate" = มุมมอง Affiliate (แอฟฟิลิเอต)
 */
export type RoleView = "root" | "owner" | "affiliate";

const ROLE_VIEW_LABELS: Record<RoleView, string> = {
  root: "Root",
  owner: "เจ้าของร้าน",
  affiliate: "Affiliate",
};
export { ROLE_VIEW_LABELS };

type AuthContextValue = {
  session: UserSession | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  login: (username: string, password: string, confirmCode?: string) => Promise<LoginResult>;
  logout: () => void;
  /** สลับบทบาทที่ Root ใช้มอง UI — ไม่กระทบ session จริง */
  roleView: RoleView;
  setRoleView: (view: RoleView) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_CACHE_KEY = "rbac_session";
const AUTH_LOGGED_OUT_KEY = "auth_logged_out";
const AUTH_TOKEN_KEY = "auth_token";
const ROLE_VIEW_KEY = "root_role_view";
const CACHE_TTL_MS = 5 * 60 * 1000;

function loadCachedSession(): UserSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const { session, ts } = JSON.parse(raw) as { session: UserSession; ts: number };
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return session;
  } catch { return null; }
}

function loadCachedToken(): string | null {
  if (typeof window === "undefined") return null;
  try { return sessionStorage.getItem(AUTH_TOKEN_KEY); }
  catch { return null; }
}

function loadCachedRoleView(): RoleView {
  if (typeof window === "undefined") return "root";
  try {
    const saved = sessionStorage.getItem(ROLE_VIEW_KEY);
    if (saved === "affiliate" || saved === "owner") return saved;
  } catch { /* ignore */ }
  return "root";
}

function saveCachedSession(session: UserSession) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ session, ts: Date.now() }));
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roleView, setRoleViewState] = useState<RoleView>("root");

  const setRoleView = useCallback((view: RoleView) => {
    setRoleViewState(view);
    if (typeof window !== "undefined") {
      if (view === "root") sessionStorage.removeItem(ROLE_VIEW_KEY);
      else sessionStorage.setItem(ROLE_VIEW_KEY, view);
    }
  }, []);

  const fetchSession = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiRequest<MeResponseApi>("/api/auth/me", { authEndpoint: true });
      const roles = (data.roles ?? []) as Role[];
      const permissions = (data.permissions ?? []) as PermissionString[];
      const newSession: UserSession = {
        userId: data.user?.id ?? "unknown",
        roles,
        permissions,
        displayName: data.user?.displayName,
        tier: (data.tier === "paid" ? "paid" : "free") as UserSession["tier"],
        tierStartedAt: data.tier_started_at ?? null,
        tierExpiresAt: data.tier_expires_at ?? null,
        inviteCodeUsed: data.invite_code_used ?? null,
        inviteSlots: data.invite_slots ?? 0,
        companyId: data.company_id ?? undefined,
        shopId: data.shop_id ?? undefined,
        shopName: data.shop_name,
      };
      setSession(newSession);
      saveCachedSession(newSession);
    } catch (e) {
      const msg = (e instanceof Error ? e.message : "Auth failed").toLowerCase();
      setError(e instanceof Error ? e.message : "Auth failed");
      const isAuthError = msg.includes("unauthorized") || msg.includes("forbidden");
      if (isAuthError) {
        setSession(null);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, "1");
          sessionStorage.removeItem(SESSION_CACHE_KEY);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (emailOrUsername: string, password: string, confirmCode?: string): Promise<LoginResult> => {
      const payload: Record<string, string> = { email: emailOrUsername.trim(), password };
      if (confirmCode) payload.confirm_code = confirmCode.trim();
      try {
        const { token } = await apiRequest<{ token: string }>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify(payload),
          authEndpoint: true,
        });
        setAuthToken(token);
        if (typeof window !== "undefined") sessionStorage.setItem(AUTH_TOKEN_KEY, token);
        await fetchSession();
        if (typeof window !== "undefined") sessionStorage.removeItem(AUTH_LOGGED_OUT_KEY);
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message.toLowerCase() : "";
        if (!confirmCode && msg.includes("confirm")) return "need_confirm";
        return false;
      }
    },
    [fetchSession]
  );

  const logout = useCallback(() => {
    setAuthToken(null);
    setSession(null);
    setError(null);
    setRoleViewState("root");
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(ROLE_VIEW_KEY);
      sessionStorage.setItem(AUTH_LOGGED_OUT_KEY, "1");
    }
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      setSession(null);
      setAuthToken(null);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(SESSION_CACHE_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
      }
    });
    return () => setOnUnauthorized(null);
  }, []);

  useEffect(() => {
    let hasToken = false;
    if (typeof window !== "undefined") {
      const cachedToken = loadCachedToken();
      if (cachedToken) {
        setAuthToken(cachedToken);
        hasToken = true;
      }
      // Restore roleView ที่ Root เลือกไว้
      setRoleViewState(loadCachedRoleView());
    }
    const cached = loadCachedSession();
    if (cached) setSession(cached);
    // Only fetch from backend if we have a token — avoids guaranteed 401 on fresh visit
    if (hasToken) {
      void fetchSession();
    } else {
      setIsLoading(false);
    }
  }, [fetchSession]);

  const value = useMemo<AuthContextValue>(
    () => ({ session, isLoading, error, refetch: fetchSession, login, logout, roleView, setRoleView }),
    [session, isLoading, error, fetchSession, login, logout, roleView, setRoleView]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Memoized permission checks (O(1)) — สำหรับ Root จะ override ตาม roleView */
export function usePermissions() {
  const { session, roleView } = useAuth();
  const isRoot = session?.roles.includes("Root") ?? false;

  const effectivePermissions = useMemo<PermissionString[]>(() => {
    if (!session) return [];
    if (!isRoot || roleView === "root") return session.permissions;
    if (roleView === "affiliate") return ROLE_PERMISSIONS["Affiliate"];
    return ROLE_PERMISSIONS["SuperAdmin"]; // owner
  }, [session, isRoot, roleView]);

  const permSet = useMemo(
    () => new Set<PermissionString>(effectivePermissions),
    [effectivePermissions]
  );

  const can = useCallback(
    (permission: PermissionString) => permSet.has(permission),
    [permSet]
  );
  const canAny = useCallback(
    (permissions: PermissionString[]) => permissions.some((p) => permSet.has(p)),
    [permSet]
  );
  const canAll = useCallback(
    (permissions: PermissionString[]) => permissions.every((p) => permSet.has(p)),
    [permSet]
  );

  return useMemo(
    () => ({ can, canAny, canAll, permissions: effectivePermissions }),
    [can, canAny, canAll, effectivePermissions]
  );
}

/** User context — สำหรับ Root จะ override role/permissions ตาม roleView */
export type UserContextValue = {
  userId: string;
  role: Role;
  roles: Role[];
  tier: "free" | "paid";
  tierStartedAt: string | null | undefined;
  tierExpiresAt: string | null | undefined;
  inviteCodeUsed: string | null | undefined;
  inviteSlots: number;
  companyId: string | undefined;
  shopId: string | null | undefined;
  shopName: string | undefined;
  displayName: string | undefined;
  permissions: PermissionString[];
  /** true = Root กำลังดูในมุมมอง role อื่น */
  isViewingAs: boolean;
};

export function useUserContext(): UserContextValue | null {
  const { session, roleView } = useAuth();
  const isRoot = session?.roles.includes("Root") ?? false;

  return useMemo(() => {
    if (!session) return null;
    const isViewingAs = isRoot && roleView !== "root";

    let role: Role;
    let permissions: PermissionString[];

    if (!isRoot || roleView === "root") {
      role = session.roles[0] ?? "Affiliate";
      permissions = session.permissions;
    } else if (roleView === "affiliate") {
      role = "Affiliate";
      permissions = getPermissionsForRoles(["Affiliate"]);
    } else {
      role = "SuperAdmin";
      permissions = getPermissionsForRoles(["SuperAdmin"]);
    }

    return {
      userId: session.userId,
      role,
      roles: session.roles,
      tier: session.tier ?? "free",
      tierStartedAt: session.tierStartedAt,
      tierExpiresAt: session.tierExpiresAt,
      inviteCodeUsed: session.inviteCodeUsed,
      inviteSlots: session.inviteSlots ?? 0,
      companyId: session.companyId,
      shopId: session.shopId,
      shopName: session.shopName,
      displayName: session.displayName,
      permissions,
      isViewingAs,
    };
  }, [session, isRoot, roleView]);
}
