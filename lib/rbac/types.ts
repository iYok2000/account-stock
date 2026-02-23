/**
 * RBAC — Types (aligned with backend spec; no secrets on client.)
 */

import type { PermissionString } from "./constants";

export type Role = "SuperAdmin" | "Admin" | "Manager" | "Staff" | "Viewer";

export interface UserSession {
  userId: string;
  roles: Role[];
  permissions: PermissionString[];
  /** Optional: display name; do not put sensitive data here */
  displayName?: string;
}

/** Backend API response shape for /me or /auth/session */
export interface MeResponse {
  user: { id: string; displayName?: string };
  roles: Role[];
  permissions: PermissionString[];
}
