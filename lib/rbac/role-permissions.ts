/**
 * RBAC — Default role → permissions (frontend fallback only; backend is source of truth.)
 * 4 roles: Root, SuperAdmin, Admin, Affiliate. See SHOPS_AND_ROLES_SPEC.md, RBAC_SPEC.md.
 */

import type { Role } from "./types";
import type { PermissionString } from "./constants";
import { RESOURCES, ACTIONS, toPermission } from "./constants";

const allResourceActions: PermissionString[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => toPermission(r, a))
);

// Root: platform only — create shops + dashboard
const rootPermissions: PermissionString[] = [
  "dashboard:read",
  "shops:create",
];

// Affiliate: only Dashboard + Import (affiliate flow)
const affiliatePermissions: PermissionString[] = [
  "dashboard:read",
  "inventory:create",
];

// Admin: all except shops:update (per RBAC_SPEC 2026-03-05 Admin มี users:*)
const adminPermissions: PermissionString[] = allResourceActions.filter(
  (p) => p !== "shops:update"
);

// SuperAdmin: all permissions (shop-scoped; includes users:*, shops:update)
const superAdminPermissions: PermissionString[] = [...allResourceActions];

export const ROLE_PERMISSIONS: Record<Role, PermissionString[]> = {
  Root: rootPermissions,
  Affiliate: affiliatePermissions,
  Admin: adminPermissions,
  SuperAdmin: superAdminPermissions,
};

export function getPermissionsForRoles(roles: Role[]): PermissionString[] {
  const set = new Set<PermissionString>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) perms.forEach((p) => set.add(p));
  }
  return Array.from(set);
}
