'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import BusinessWorkspaceLoader from "@/components/business/BusinessWorkspaceLoader";
import { SiteConfigProvider } from "@/components/SiteConfigProvider";
import { DEFAULT_SITE_CONFIG, type SiteConfig } from "@/lib/siteConfigShared";

const MERCHANT_APP_PREFIXES = [
  '/business/dashboard',
  '/business/list',
  '/business/kyc/',
];

function isBusinessOnboardingPreview(pathname: string | null) {
  return pathname === '/business/onboarding-preview';
}

function isBusinessDashboardRoute(pathname: string | null) {
  return pathname === '/business/dashboard' || Boolean(pathname?.startsWith('/business/dashboard/'));
}

function isBusinessAuthPage(pathname: string | null) {
  return pathname === '/business/login' || pathname === '/business/register';
}

function isPublicBusinessProfile(pathname: string | null) {
  if (!pathname?.startsWith('/business/')) return false;
  const slug = pathname.slice('/business/'.length).split('?')[0];
  if (!slug || slug.includes('/')) return false;
  const reserved = new Set(['login', 'register', 'dashboard', 'list', 'payment', 'kyc']);
  return !reserved.has(slug);
}

function isBusinessProfileRoute(pathname: string | null) {
  return isPublicBusinessProfile(pathname);
}

function isMerchantAppShell(pathname: string | null) {
  if (!pathname?.startsWith('/business')) return false;
  if (isPublicBusinessProfile(pathname)) return false;
  if (isBusinessAuthPage(pathname)) return false;
  return MERCHANT_APP_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix)
  );
}

function isUserDashboardRoute(pathname: string | null) {
  return pathname === '/dashboard' || Boolean(pathname?.startsWith('/dashboard/'));
}
import BottomNavbar from "@/components/BottomNavbar";
import LocationPermissionPrompt from "@/components/LocationPermissionPrompt";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import ScrollRestoration from "@/components/ScrollRestoration";
import ScrollToTopButton from "@/components/ScrollToTopButton";
import { UserLocationProvider } from '@/hooks/useUserCoords';
import LoginRoleToast from '@/components/LoginRoleToast';
import { useMobileGate } from '@/hooks/useMobileGate';
import { VERIFY_MOBILE_PATH } from '@/lib/mobileGate';

function isHomePage(pathname: string | null) {
  return pathname === '/';
}

const SPLASH_COOKIE = 'finderb_splash=1; Path=/; SameSite=Lax';

function rememberSplash() {
  try {
    document.cookie = SPLASH_COOKIE;
  } catch {
    // Private mode can reject cookie writes. The in-memory flag still blocks repeats.
  }
}

function splashAlreadySeen() {
  try {
    return document.cookie.split(';').some((part) => part.trim().startsWith('finderb_splash='));
  } catch {
    return true;
  }
}

export default function LayoutClient({
  children,
  siteConfig = DEFAULT_SITE_CONFIG,
}: {
  children: React.ReactNode;
  siteConfig?: SiteConfig;
}) {
  const pathname = usePathname();
  useMobileGate();
  const businessDashboardRoute = isBusinessDashboardRoute(pathname);
  const businessProfileRoute = isBusinessProfileRoute(pathname);
  const merchantAppShell = isMerchantAppShell(pathname);
  const isCategoriesIndex = pathname === '/categories';
  const isCategoriesBrowse =
    isCategoriesIndex ||
    (pathname?.startsWith('/categories/') &&
      !pathname.startsWith('/categories/job'));
  const userDashboardRoute = isUserDashboardRoute(pathname);
  // Instant browse: no splash on home or categories (index + /categories/{slug}).
  const skipSplash =
    isHomePage(pathname) ||
    isCategoriesBrowse ||
    businessProfileRoute ||
    userDashboardRoute ||
    pathname === VERIFY_MOBILE_PATH ||
    isBusinessOnboardingPreview(pathname);
  const [loading, setLoading] = useState(false);
  const playOnEntry = useRef(false);
  const entryPath = useRef(pathname);
  const skipSplashOnEntry = useRef(skipSplash);
  const hideTopNavFooter =
    merchantAppShell ||
    isCategoriesBrowse ||
    userDashboardRoute ||
    isBusinessOnboardingPreview(pathname);
  const showBottomNav =
    !merchantAppShell && !userDashboardRoute && !isBusinessOnboardingPreview(pathname);
  const showBottomNavPadding = showBottomNav && !isCategoriesBrowse;
  const showLocationPrompt =
    !merchantAppShell &&
    !isCategoriesBrowse &&
    !userDashboardRoute &&
    !isBusinessOnboardingPreview(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (root.classList.contains('finderb-splash-on')) {
      const hide = window.setTimeout(() => {
        root.classList.remove('finderb-splash-on');
        rememberSplash();
      }, 1100);
      return () => window.clearTimeout(hide);
    }

    const shouldPlay = !splashAlreadySeen() && !skipSplashOnEntry.current;
    playOnEntry.current = shouldPlay;
    if (!shouldPlay) return;
    rememberSplash();
    setLoading(true);
    const timer = window.setTimeout(() => setLoading(false), 1100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (pathname !== entryPath.current) setLoading(false);
  }, [pathname]);

  return (
    <SiteConfigProvider value={siteConfig}>
    <UserLocationProvider>
      {!isBusinessOnboardingPreview(pathname) && (
        <PWAInstallPrompt appReady={!loading} />
      )}
      {/*
        Keep the splash as an overlay only. Never replace `{children}` while
        loading — that made SSR/HTML for crawlers (ChatGPT, Claude, etc.)
        contain only the splash text and look "uncrawlable".
      */}
      <Loader />
      {loading && businessDashboardRoute ? (
        <div aria-hidden="true">
          <BusinessWorkspaceLoader />
        </div>
      ) : null}
      {/*
        Navbar, page, and footer stay in one boundary. The fallback fills the
        screen, so a slow page cannot paint the footer before the content.
      */}
      <Suspense
        fallback={
          businessDashboardRoute ? <BusinessWorkspaceLoader /> : <Loader active />
        }
      >
      <div
        className={`flex flex-col min-h-svh ${showBottomNavPadding ? 'pb-[6.75rem] lg:pb-0' : ''}`}
        aria-busy={loading || undefined}
        inert={loading ? true : undefined}
      >
        <Suspense fallback={null}>
          <ScrollRestoration />
        </Suspense>
        <Suspense fallback={null}>
          <LoginRoleToast />
        </Suspense>
        {!hideTopNavFooter && <Navbar />}
        <main className="min-w-0 flex-1 overflow-x-hidden">
          {children}
        </main>
        {!hideTopNavFooter && <Footer />}
        {showBottomNav && <BottomNavbar />}
        {showLocationPrompt && <LocationPermissionPrompt appReady={!loading} />}
        {!isBusinessOnboardingPreview(pathname) && (
          <ScrollToTopButton showBottomNav={showBottomNav} />
        )}
      </div>
      </Suspense>
    </UserLocationProvider>
    </SiteConfigProvider>
  );
}
