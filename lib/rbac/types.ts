/**
 * RBAC — Types (aligned with backend spec; no secrets on client.)
 */

import type { PermissionString } from "./constants";

/** 4 roles: Root (platform); SuperAdmin, Admin, Affiliate (shop-scoped). See SHOPS_AND_ROLES_SPEC.md */
export type Role = "Root" | "SuperAdmin" | "Admin" | "Affiliate";

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
  /** Tenant/company scope (legacy); prefer shopId for new code. */
  companyId?: string;
  /** Shop scope (SHOPS_AND_ROLES_SPEC); null for Root only. */
  shopId?: string | null;
  /** Shop display name when available from API. */
  shopName?: string;
}

/** Backend API response shape for /me or /auth/session */
export interface MeResponse {
  user: { id: string; displayName?: string };
  roles: Role[];
  permissions: PermissionString[];
  tier?: UserTier;
  company_id?: string;
  shop_id?: string | null;
  shop_name?: string;
}
