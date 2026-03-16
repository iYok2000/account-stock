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

// Root: platform admin — highest authority, has ALL permissions (SHOPS_AND_ROLES_SPEC §1, RBAC_BACKEND_SPEC §4)
const rootPermissions: PermissionString[] = [...allResourceActions];

// Affiliate: Dashboard + Import + analytics (phase 1)
const affiliatePermissions: PermissionString[] = [
  "dashboard:read",
  "inventory:create",
  "analytics:read",
];

// Admin: all shop features EXCEPT users:*, shops:update, analytics:read (SHOPS_AND_ROLES_SPEC §1, RBAC_BACKEND_SPEC §4)
const adminPermissions: PermissionString[] = allResourceActions.filter(
  (p) =>
    !p.startsWith("users:") &&
    p !== "shops:update" &&
    p !== "analytics:read" &&
    !p.startsWith("invites:") &&
    !p.startsWith("config:")
);

// SuperAdmin: all shop features + users:* + shops:update + invites (RBAC_BACKEND_SPEC §4)
const superAdminPermissions: PermissionString[] = allResourceActions.filter(
  (p) => p !== "analytics:read" && !p.startsWith("config:")
);

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
