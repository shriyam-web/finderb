/** Admin with access to all login logs across accounts. */
export const CONTROLLER_ADMIN_ROLES = new Set(['controller', 'controller_admin']);

export function isControllerAdmin(role: string | null | undefined): boolean {
  return CONTROLLER_ADMIN_ROLES.has((role ?? '').toLowerCase().trim());
}

export function canViewAllAdminLoginLogs(role: string | null | undefined): boolean {
  return isControllerAdmin(role);
}

export function canViewAdminAuditLogs(role: string | null | undefined): boolean {
  return isControllerAdmin(role);
}
