import { useCallback } from 'react';
import { Alert, BackHandler } from 'react-native';
import { type Href, useRouter, useSegments } from 'expo-router';

export const CONSOLE_HOME = '/business-console' as Href;

const DOCK_HREF: Record<string, Href> = {
  index: '/business-console',
  leads: '/business-console/leads',
  listing: '/business-console/listing',
  reviews: '/business-console/reviews',
  subscription: '/business-console/subscription',
  more: '/business-console/more',
};

let dockHistory: string[] = ['index'];

export function rememberDockTab(name: string) {
  const tab = DOCK_HREF[name] ? name : 'index';
  if (dockHistory[dockHistory.length - 1] === tab) return;
  dockHistory.push(tab);
}

function popDockTab() {
  if (dockHistory.length > 1) dockHistory.pop();
  return dockHistory[dockHistory.length - 1] || 'index';
}

function peekDockTab() {
  return dockHistory[dockHistory.length - 1] || 'index';
}

export function lastDockTab() {
  return peekDockTab();
}

export function dockTabHref(name: string): Href {
  return dockHref(name);
}

function dockHref(name: string): Href {
  return DOCK_HREF[name] || CONSOLE_HOME;
}

function hrefPath(href: Href) {
  if (typeof href === 'string') return href.split('?')[0];
  const path = (href as { pathname?: string }).pathname || '';
  return path.split('?')[0];
}

export function askStorefrontPreview(
  router: { push: (href: Href) => void },
  id: string,
) {
  Alert.alert('Preview storefront', 'Open this page as your business, or the way a visitor sees it?', [
    {
      text: 'As your business',
      onPress: () => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id, preview: 'owner' } }),
    },
    {
      text: 'As a visitor',
      onPress: () => router.push({ pathname: '/(tabs)/merchant/[id]', params: { id, preview: 'visitor' } }),
    },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

/** Dock tabs switch in place. Stack screens (alerts, edit, …) still push. */
export function openConsolePath(router: { navigate: (href: Href) => void; push: (href: Href) => void }, href: Href) {
  const path = hrefPath(href);
  if (path === '/business-console' || Object.values(DOCK_HREF).some((item) => item === path)) {
    router.navigate(href);
    return;
  }
  router.push(href);
}

function currentDockTab(segments: string[]) {
  if (segments[0] !== 'business-console' || segments[1] !== '(dock)') return null;
  return segments[2] || 'index';
}

export function useConsoleBackAction() {
  const router = useRouter();
  const segments = useSegments();

  return useCallback(
    (kind: 'header' | 'hardware' = 'header') => {
      if (segments[0] !== 'business-console') {
        router.replace(CONSOLE_HOME);
        return true;
      }

      const tab = currentDockTab(segments);
      if (tab) {
        if (tab === 'index') {
          if (kind === 'hardware') BackHandler.exitApp();
          return true;
        }
        router.navigate(dockHref(popDockTab()));
        return true;
      }

      if (typeof router.dismiss === 'function') {
        router.dismiss();
        return true;
      }

      router.navigate(dockHref(peekDockTab()));
      return true;
    },
    [router, segments],
  );
}
