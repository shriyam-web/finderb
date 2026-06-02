'use client';

import { Suspense, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Loader from "@/components/Loader";
import BottomNavbar from "@/components/BottomNavbar";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');
  const isCategories = pathname === '/categories' || pathname?.startsWith('/categories/');
  const hideTopNavFooter = isDashboard || isCategories;
  const showBottomNav = !isDashboard;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={`flex flex-col min-h-screen ${showBottomNav ? 'pb-28 lg:pb-0' : ''}`}>
      {!hideTopNavFooter && <Navbar />}
      <Suspense fallback={<div className="flex-grow bg-white" />}>
        <main className="flex-grow">
          {children}
        </main>
        {!hideTopNavFooter && <Footer />}
      </Suspense>
      {showBottomNav && <BottomNavbar />}
    </div>
  );
}
