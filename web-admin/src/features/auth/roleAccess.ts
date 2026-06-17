import type { RoleDto } from '@/features/roles/types/role';

export const ROLE_ADMIN = 'Admin';
export const ROLE_VENDOR = 'Vendor';
export const ROLE_SUPER_ADMIN = 'SuperAdmin';
export const ROLE_GUEST = 'Guest';

const ADMIN_ALIASES = [ROLE_ADMIN, ROLE_SUPER_ADMIN];
const ASSIGNABLE_ROLE_ORDER = [ROLE_ADMIN, ROLE_VENDOR, ROLE_SUPER_ADMIN];

export function isAdminRole(role?: string | null): boolean {
  return Boolean(role && ADMIN_ALIASES.includes(role));
}

export function roleMatches(userRole: string | undefined | null, allowedRoles?: string[]): boolean {
  if (!allowedRoles?.length) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  if (allowedRoles.includes(userRole)) {
    return true;
  }

  return isAdminRole(userRole) && allowedRoles.some((role) => isAdminRole(role));
}

export function displayRoleName(role?: string | null): string {
  if (role === ROLE_SUPER_ADMIN) {
    return 'Admin (legacy SuperAdmin)';
  }

  return role ?? '-';
}

export function getAssignableRoles(roles: RoleDto[]): RoleDto[] {
  return roles
    .filter((role) => role.name !== ROLE_GUEST)
    .filter((role) => ASSIGNABLE_ROLE_ORDER.includes(role.name))
    .sort((a, b) => roleSortIndex(a.name) - roleSortIndex(b.name));
}

export function isSystemRole(roleName: string): boolean {
  return [
    ROLE_ADMIN,
    ROLE_VENDOR,
    ROLE_SUPER_ADMIN,
    'ContentAdmin',
    'TourOperator',
    'AnalyticsViewer',
    ROLE_GUEST,
  ].includes(roleName);
}

function roleSortIndex(roleName: string): number {
  const index = ASSIGNABLE_ROLE_ORDER.indexOf(roleName);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
