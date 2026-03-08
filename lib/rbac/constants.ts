/**
 * RBAC — Permission constants (Security: frontend uses only for UI; backend is source of truth.)
 */

export const RESOURCES = [
  "dashboard",
  "inventory",
  "shops",      // sales channels
  "promotions", // campaigns, vouchers, fees
  "analysis",   // calculator, tax, reports
  "agents",     // AI assistant / automation (ไม่มีเมนูใน v1)
  "users",      // user management — Admin/SuperAdmin
] as const;

export const ACTIONS = ["read", "create", "update", "delete", "export"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/** Permission string format: resource:action (e.g. inventory:read) */
export type PermissionString = `${Resource}:${Action}`;

export function toPermission(resource: Resource, action: Action): PermissionString {
  return `${resource}:${action}`;
}

/**
 * Permissions required to access each nav route.
 * Root = dashboard:read + shops:create
 * Affiliate = dashboard:read + import (affiliate)
 * Admin = full except users/shops update
 * SuperAdmin = full
 */
export const NAV_PERMISSIONS: Record<string, PermissionString> = {
  "/": "dashboard:read",
  "/inventory": "inventory:read",
  "/import": "inventory:create",
  "/shops/create": "shops:create",
  "/shops/me": "users:read",
  "/campaigns": "promotions:read",
  "/vouchers": "promotions:read",
  "/fees": "promotions:read",
  "/calculator": "analysis:read",
  "/tax": "analysis:read",
  "/reports": "analysis:read",
  "/users": "users:read",
} as const;
