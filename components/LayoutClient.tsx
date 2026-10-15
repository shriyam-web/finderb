'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import BusinessWorkspaceLoader from "@/components/business/BusinessWorkspaceLoader";

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

export default function LayoutClient({ children }: { children: React.ReactNode }) {
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
  const [loading, setLoading] = useState(!skipSplash);
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
    if (skipSplash) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [skipSplash, pathname]);

  return (
    <UserLocationProvider>
      {!isBusinessOnboardingPreview(pathname) && (
        <PWAInstallPrompt appReady={!loading} />
      )}
      {/*
        Keep the splash as an overlay only. Never replace `{children}` while
        loading — that made SSR/HTML for crawlers (ChatGPT, Claude, etc.)
        contain only the splash text and look "uncrawlable".
      */}
      {loading && (
        <div aria-hidden="true">
          {businessDashboardRoute ? <BusinessWorkspaceLoader /> : <Loader />}
        </div>
      )}
      <div
        className={`flex flex-col min-h-screen ${showBottomNavPadding ? 'pb-[6.75rem] lg:pb-0' : ''}`}
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
        <Suspense fallback={<div className="flex-grow bg-white" />}>
          <main className="min-w-0 flex-grow overflow-x-hidden">
            {children}
          </main>
        </Suspense>
        {!hideTopNavFooter && <Footer />}
        {showBottomNav && <BottomNavbar />}
        {showLocationPrompt && <LocationPermissionPrompt appReady={!loading} />}
        {!isBusinessOnboardingPreview(pathname) && (
          <ScrollToTopButton showBottomNav={showBottomNav} />
        )}
      </div>
    </UserLocationProvider>
  );
}
