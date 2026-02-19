/**
 * RBAC — Default role → permissions (frontend fallback only; backend is source of truth.)
 * Used when API is not available (dev/mock). Backend must enforce all checks.
 *
 * Role matrix:
 * ──────────────────────────────────────────────────────────────────
 * Resource      Action      Viewer  Staff   Manager Admin
 * ──────────────────────────────────────────────────────────────────
 * dashboard     read        ✓       ✓       ✓       ✓
 * inventory     read        ✓       ✓       ✓       ✓
 * inventory     create/update/delete/export  —  ✓   ✓       ✓
 * orders        read        ✓       ✓       ✓       ✓
 * orders        create/update/export         —  ✓   ✓       ✓
 * suppliers     read        ✓       ✓       ✓       ✓
 * suppliers     create/update/delete         —  —   ✓       ✓
 * shops         read        —       ✓       ✓       ✓
 * shops         create/update/delete         —  —   ✓       ✓
 * promotions    read        —       ✓       ✓       ✓
 * promotions    create/update/delete/export  —  —   ✓       ✓
 * analysis      read        —       ✓       ✓       ✓
 * analysis      export      —       —       ✓       ✓
 * agents        read        —       —       ✓       ✓
 * agents        create/update/delete         —  —   —       ✓
 * settings      read        —       —       ✓       ✓
 * settings      update      —       —       —       ✓
 * ──────────────────────────────────────────────────────────────────
 */

import type { Role } from "./types";
import type { PermissionString } from "./constants";
import { RESOURCES, ACTIONS, toPermission } from "./constants";

const allPermissions: PermissionString[] = RESOURCES.flatMap((r) =>
  ACTIONS.map((a) => toPermission(r, a))
);

// Viewer: only core read access (no shops/promotions/analysis/agents/settings)
const viewerPermissions: PermissionString[] = [
  "dashboard:read",
  "inventory:read",
  "orders:read",
  "suppliers:read",
];

// Staff: Viewer + inventory/orders write + shops/promotions/analysis read
const staffPermissions: PermissionString[] = [
  ...viewerPermissions,
  "inventory:create",
  "inventory:update",
  "inventory:delete",
  "inventory:export",
  "orders:create",
  "orders:update",
  "orders:export",
  "shops:read",
  "promotions:read",
  "analysis:read",
];

// Manager: Staff + suppliers/shops/promotions write + analysis export + agents/settings read
const managerPermissions: PermissionString[] = [
  ...staffPermissions,
  "suppliers:create",
  "suppliers:update",
  "suppliers:delete",
  "shops:create",
  "shops:update",
  "shops:delete",
  "promotions:create",
  "promotions:update",
  "promotions:delete",
  "promotions:export",
  "analysis:export",
  "agents:read",
  "settings:read",
];

/** Static map: role → permissions. Replace with API response when backend is ready. */
export const ROLE_PERMISSIONS: Record<Role, PermissionString[]> = {
  Viewer: viewerPermissions,
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
