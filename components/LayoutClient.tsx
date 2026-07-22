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

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const businessDashboardRoute = isBusinessDashboardRoute(pathname);
  const businessProfileRoute = isBusinessProfileRoute(pathname);
  const merchantAppShell = isMerchantAppShell(pathname);
  const isCategoriesIndex = pathname === '/categories';
  const isCategoriesBrowse =
    isCategoriesIndex ||
    (pathname?.startsWith('/categories/') &&
      !pathname.startsWith('/categories/job') &&
      !pathname.startsWith('/categories/admissions'));
  const userDashboardRoute = isUserDashboardRoute(pathname);
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
    if (businessProfileRoute || userDashboardRoute || isBusinessOnboardingPreview(pathname)) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [businessProfileRoute, userDashboardRoute, pathname]);

  return (
    <UserLocationProvider>
      {!isBusinessOnboardingPreview(pathname) && (
        <PWAInstallPrompt appReady={!loading} />
      )}
      {loading ? (
        businessDashboardRoute ? (
          <BusinessWorkspaceLoader />
        ) : (
          <Loader />
        )
      ) : (
        <div className={`flex flex-col min-h-screen ${showBottomNavPadding ? 'pb-[6.75rem] lg:pb-0' : ''}`}>
          <Suspense fallback={null}>
            <ScrollRestoration />
          </Suspense>
          {!hideTopNavFooter && <Navbar />}
          <Suspense fallback={<div className="flex-grow bg-white" />}>
            <main className="min-w-0 flex-grow overflow-x-hidden">
              {children}
            </main>
            {!hideTopNavFooter && <Footer />}
          </Suspense>
          {showBottomNav && <BottomNavbar />}
          {showLocationPrompt && <LocationPermissionPrompt appReady />}
          {!isBusinessOnboardingPreview(pathname) && (
            <ScrollToTopButton showBottomNav={showBottomNav} />
          )}
        </div>
      )}
    </UserLocationProvider>
  );
}
