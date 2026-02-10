/**
 * RBAC — Permission constants (Security: frontend uses only for UI; backend is source of truth.)
 */

export const RESOURCES = [
  "dashboard",
  "inventory",
  "orders",
  "suppliers",
  "reports",
] as const;

export const ACTIONS = ["read", "create", "update", "delete", "export"] as const;

export type Resource = (typeof RESOURCES)[number];
export type Action = (typeof ACTIONS)[number];

/** Permission string format: resource:action (e.g. inventory:read) */
export type PermissionString = `${Resource}:${Action}`;

export function toPermission(resource: Resource, action: Action): PermissionString {
  return `${resource}:${action}`;
}

/** Permissions required to see each nav item (read = access page) */
export const NAV_PERMISSIONS: Record<string, PermissionString> = {
  "/": "dashboard:read",
  "/inventory": "inventory:read",
  "/orders": "orders:read",
  "/suppliers": "suppliers:read",
  "/reports": "reports:read",
} as const;
