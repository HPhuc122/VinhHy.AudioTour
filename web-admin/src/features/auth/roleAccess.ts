import type { RoleDto } from '@/features/roles/types/role';

export const ROLE_ADMIN = 'Admin';
export const ROLE_VENDOR = 'Vendor';
export const ROLE_SUPER_ADMIN = 'SuperAdmin';
export const ROLE_GUEST = 'Guest';

const ADMIN_ALIASES = [ROLE_ADMIN, ROLE_SUPER_ADMIN];
const CMS_VISIBLE_ROLE_ORDER = [ROLE_ADMIN, ROLE_VENDOR];
const ASSIGNABLE_ROLE_ORDER = [ROLE_ADMIN, ROLE_VENDOR];

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
    return 'Admin (legacy)';
  }

  if (role === 'ContentAdmin' || role === 'TourOperator' || role === 'AnalyticsViewer') {
    return 'Vai trò cũ';
  }

  if (role === ROLE_GUEST) {
    return 'Không áp dụng';
  }

  return role ?? '-';
}

export function getCmsVisibleRoles(roles: RoleDto[]): RoleDto[] {
  return roles
    .filter((role) => CMS_VISIBLE_ROLE_ORDER.includes(role.name))
    .sort((a, b) => roleSortIndex(a.name, CMS_VISIBLE_ROLE_ORDER) - roleSortIndex(b.name, CMS_VISIBLE_ROLE_ORDER));
}

export function getAssignableRoles(roles: RoleDto[]): RoleDto[] {
  return roles
    .filter((role) => role.name !== ROLE_GUEST)
    .filter((role) => ASSIGNABLE_ROLE_ORDER.includes(role.name))
    .sort((a, b) => roleSortIndex(a.name, ASSIGNABLE_ROLE_ORDER) - roleSortIndex(b.name, ASSIGNABLE_ROLE_ORDER));
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

function roleSortIndex(roleName: string, order: string[]): number {
  const index = order.indexOf(roleName);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}
