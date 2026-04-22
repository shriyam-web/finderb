'use client';

import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.includes('/dashboard');

  return (
    <div className={`flex flex-col min-h-screen ${!isDashboard ? 'pb-24' : ''}`}>
      {!isDashboard && <Navbar />}
      <Suspense fallback={<div className="flex-grow bg-white" />}>
        <main className="flex-grow">
          {children}
        </main>
        {!isDashboard && <Footer />}
      </Suspense>
    </div>
  );
}
