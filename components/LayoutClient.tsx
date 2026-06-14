'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import BottomNavbar from "@/components/BottomNavbar";
import LocationPermissionPrompt from "@/components/LocationPermissionPrompt";
import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt";
import ScrollRestoration from "@/components/ScrollRestoration";
import { UserLocationProvider } from '@/hooks/useUserCoords';

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');
  const isCategories = pathname === '/categories' || pathname?.startsWith('/categories/');
  const hideTopNavFooter = isDashboard || isCategories;
  const showBottomNav = !isDashboard;
  const showLocationPrompt = !isDashboard;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <UserLocationProvider>
      <PWAInstallPrompt appReady={!loading} />
      {loading ? (
        <Loader />
      ) : (
        <div className={`flex flex-col min-h-screen ${showBottomNav ? 'pb-[6.75rem] lg:pb-0' : ''}`}>
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
        </div>
      )}
    </UserLocationProvider>
  );
}
