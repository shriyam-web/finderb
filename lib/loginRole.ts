export type LoginRole = 'business' | 'user';

export const LOGIN_ROLE_PARAM = 'as';

export function withLoginRole(path: string, role: LoginRole): string {
  const url = path.startsWith('http')
    ? new URL(path)
    : new URL(path, 'https://finderb.com');
  url.searchParams.set(LOGIN_ROLE_PARAM, role);
  if (path.startsWith('http')) return url.toString();
  return `${url.pathname}${url.search}${url.hash}`;
}

export function loginRoleFromParam(value: string | null | undefined): LoginRole | null {
  return value === 'business' || value === 'user' ? value : null;
}
