/** Dedicated controller account — may view all login & audit logs. */
export const CONTROLLER_ADMIN_EMAIL = 'controller.dev@finderb.com';

/** Admin roles with controller-level log access. */
export const CONTROLLER_ADMIN_ROLES = new Set(['controller', 'controller_admin']);

export function isControllerAdmin(
  role: string | null | undefined,
  email?: string | null | undefined
): boolean {
  const normalizedEmail = (email ?? '').toLowerCase().trim();
  if (normalizedEmail === CONTROLLER_ADMIN_EMAIL) return true;
  return CONTROLLER_ADMIN_ROLES.has((role ?? '').toLowerCase().trim());
}

export function canViewAllAdminLoginLogs(
  role: string | null | undefined,
  email?: string | null | undefined
): boolean {
  return isControllerAdmin(role, email);
}

export function canViewAllAdminAuditLogs(
  role: string | null | undefined,
  email?: string | null | undefined
): boolean {
  return isControllerAdmin(role, email);
}
