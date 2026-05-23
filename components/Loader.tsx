'use client';

import React from 'react';
import Image from 'next/image';

const Loader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white animate-[fade-in_0.5s_ease-out]">
      <div className="relative flex flex-col items-center">
        {/* Animated rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-64 w-64 animate-[ping_4s_linear_infinite] rounded-full border-2 border-primary-50 opacity-10"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-48 w-48 animate-[ping_3s_linear_infinite] rounded-full border-2 border-primary-100 opacity-20"></div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-32 w-32 animate-[ping_2s_linear_infinite] rounded-full border-2 border-primary-200 opacity-40"></div>
        </div>
        
        {/* Logo container with float animation */}
        <div className="relative mb-8 flex h-36 w-36 items-center justify-center rounded-3xl bg-white p-6 shadow-premium animate-float ring-8 ring-primary-50/50">
          <Image
            src="/icon.png"
            alt="FinderB Logo"
            width={140}
            height={140}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        {/* Text and progress bar */}
        <div className="text-center px-4">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-primary-800 animate-[slide-up_0.8s_ease-out]">
            Finder<span className="text-secondary-500">B</span>
          </h2>
          <div className="mx-auto h-2 w-64 overflow-hidden rounded-full bg-primary-50 shadow-inner">
            <div className="h-full animate-[loading-bar_3s_ease-in-out_infinite] rounded-full bg-gradient-to-r from-primary-500 via-secondary-400 to-primary-600"></div>
          </div>
          <p className="mt-6 text-base font-medium text-primary-600/80 animate-pulse">
            Curating local excellence for you...
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 80%; transform: translateX(0%); }
          100% { width: 100%; transform: translateX(100%); }
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
