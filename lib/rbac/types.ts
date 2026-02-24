/**
 * RBAC — Types (aligned with backend spec; no secrets on client.)
 */

import type { PermissionString } from "./constants";

export type Role = "SuperAdmin" | "Admin" | "Manager" | "Staff" | "Viewer";

/** Tier: service level (USER_SPEC); not part of RBAC. */
export type UserTier = "free" | "paid";

export interface UserSession {
  userId: string;
  roles: Role[];
  permissions: PermissionString[];
  /** Optional: display name; do not put sensitive data here */
  displayName?: string;
  /** Service tier (USER_SPEC); used for feature caps, not RBAC. */
  tier?: UserTier;
  /** Tenant/company scope (USER_SPEC); backend scopes data by company_id. */
  companyId?: string;
}

/** Backend API response shape for /me or /auth/session */
export interface MeResponse {
  user: { id: string; displayName?: string };
  roles: Role[];
  permissions: PermissionString[];
  tier?: UserTier;
  company_id?: string;
}
