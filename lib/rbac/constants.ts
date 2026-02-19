/**
 * RBAC — Permission constants (Security: frontend uses only for UI; backend is source of truth.)
 */

export const RESOURCES = [
  "dashboard",
  "inventory",
  "orders",
  "suppliers",
  "shops",      // sales channels
  "promotions", // campaigns, vouchers, fees
  "analysis",   // calculator, tax, funnels, reports
  "agents",     // AI assistant / automation
  "settings",   // system configuration
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
 * Viewer = all :read except shops/promotions/analysis/agents/settings
 * Staff  = Viewer + inventory/orders write + shops/promotions/analysis read
 * Manager = Staff + analysis:export + settings:read
 * Admin  = everything
 */
export const NAV_PERMISSIONS: Record<string, PermissionString> = {
  "/":           "dashboard:read",
  "/inventory":  "inventory:read",
  "/orders":     "orders:read",
  "/import":     "inventory:create",
  "/suppliers":  "suppliers:read",
  "/shops":      "shops:read",
  "/campaigns":  "promotions:read",
  "/vouchers":   "promotions:read",
  "/fees":       "promotions:read",
  "/calculator": "analysis:read",
  "/tax":        "analysis:read",
  "/funnels":    "analysis:read",
  "/reports":    "analysis:read",
  "/agents":     "agents:read",
  "/settings":   "settings:read",
} as const;
