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
  /** When current tier started (ISO 8601) */
  tierStartedAt?: string | null;
  /** When current tier expires (ISO 8601; null = unlimited) */
  tierExpiresAt?: string | null;
  /** Last invite code used */
  inviteCodeUsed?: string | null;
  /** Remaining invite slots for referral */
  inviteSlots?: number;
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
  tier_started_at?: string | null;
  tier_expires_at?: string | null;
  invite_code_used?: string | null;
  invite_slots?: number;
  company_id?: string;
  shop_id?: string | null;
  shop_name?: string;
}
