/**
 * RBAC — Default role → permissions (frontend fallback only; backend is source of truth.)
 * Used when API is not available (dev/mock). Backend must enforce all checks.
 */

import type { Role } from "./types";
import type { PermissionString } from "./constants";
import { RESOURCES, ACTIONS, toPermission } from "./constants";

const allPermissions: PermissionString[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => toPermission(r, a))
);

const readOnly: PermissionString[] = RESOURCES.map((r) => toPermission(r, "read"));

const staffPermissions: PermissionString[] = [
  ...readOnly,
  "inventory:create",
  "inventory:update",
  "inventory:delete",
  "inventory:export",
  "orders:create",
  "orders:update",
  "orders:export",
  "suppliers:read",
];

const managerPermissions: PermissionString[] = [
  ...staffPermissions,
  "reports:read",
  "reports:export",
];

/** Static map: role → permissions. Replace with API response when backend is ready. */
export const ROLE_PERMISSIONS: Record<Role, PermissionString[]> = {
  Viewer: readOnly,
  Staff: staffPermissions,
  Manager: managerPermissions,
  Admin: allPermissions,
};

export function getPermissionsForRoles(roles: Role[]): PermissionString[] {
  const set = new Set<PermissionString>();
  for (const role of roles) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) perms.forEach((p) => set.add(p));
  }
  return Array.from(set);
}
