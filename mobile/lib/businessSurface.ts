/** Consumer login prompts stay off while someone is using the business side. */
export function isBusinessSurface(path: string | null | undefined): boolean {
  const clean = (path || '').split('?')[0].replace(/\/\([^/]+\)/g, '');
  return (
    clean === '/business' ||
    clean.startsWith('/business/') ||
    clean.startsWith('/business-') ||
    clean.startsWith('/merchant-welcome')
  );
}
