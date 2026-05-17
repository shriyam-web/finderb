'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');
  const isCategories = pathname === '/categories';
  const hideNavFooter = isDashboard || isCategories;

  return (
    <div className={`flex flex-col min-h-screen ${!hideNavFooter ? 'pb-24' : ''}`}>
      {!hideNavFooter && <Navbar />}
      <Suspense fallback={<div className="flex-grow bg-white" />}>
        <main className="flex-grow">
          {children}
        </main>
        {!hideNavFooter && <Footer />}
      </Suspense>
    </div>
  );
}
