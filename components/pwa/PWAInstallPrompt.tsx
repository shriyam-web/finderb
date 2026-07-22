'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Download, Share, X, Plus, Smartphone } from 'lucide-react';
import {
  PWA_COPY,
  clearDeferredInstallPrompt,
  dismissInstallPrompt,
  initInstallPromptCapture,
  isIosSafari,
  isPwaAlreadyInstalled,
  isStandaloneMode,
  markPwaInstalled,
  shouldShowInstallPrompt,
  subscribeInstallPrompt,
  type BeforeInstallPromptEvent,
} from '@/lib/pwa';

export default function PWAInstallPrompt({ appReady = true }: { appReady?: boolean }) {
  const pathname = usePathname();
  const [eligible, setEligible] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIosGuide, setIsIosGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  const isDashboard = pathname?.includes('/dashboard') ?? false;
  const canInstallNative = Boolean(deferredPrompt);
  const canShowUi = eligible && !isDashboard && (canInstallNative || isIosGuide);

  useEffect(() => {
    initInstallPromptCapture();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const evaluate = async () => {
      if (!appReady || isDashboard) {
        if (!cancelled) {
          setEligible(false);
          setVisible(false);
          setShowModal(false);
        }
        return;
      }

      if (isStandaloneMode() || (await isPwaAlreadyInstalled()) || !shouldShowInstallPrompt()) {
        if (!cancelled) {
          setEligible(false);
          setVisible(false);
          setShowModal(false);
          setIsIosGuide(false);
        }
        return;
      }

      if (!cancelled) {
        setEligible(true);
        if (isIosSafari()) setIsIosGuide(true);
      }
    };

    void evaluate();
    return () => {
      cancelled = true;
    };
  }, [appReady, isDashboard, pathname]);

  useEffect(() => {
    if (!eligible) return;

    return subscribeInstallPrompt((event) => {
      setDeferredPrompt(event);
      if (event) {
        setIsIosGuide(false);
        setVisible(true);
      }
    });
  }, [eligible]);

  useEffect(() => {
    if (!eligible || !canShowUi) return;

    setVisible(true);

    const modalShown = sessionStorage.getItem('finderb-pwa-modal-shown');
    if (modalShown) return;

    const timer = window.setTimeout(() => {
      setShowModal(true);
      sessionStorage.setItem('finderb-pwa-modal-shown', '1');
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [eligible, canShowUi]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) {
      if (isIosGuide) setShowModal(true);
      return;
    }

    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        markPwaInstalled();
        setVisible(false);
        setShowModal(false);
        setEligible(false);
      }
    } finally {
      clearDeferredInstallPrompt();
      setDeferredPrompt(null);
      setInstalling(false);
    }
  }, [deferredPrompt, isIosGuide]);

  const handleLater = useCallback(() => {
    setShowModal(false);
  }, []);

  const handleDismiss = useCallback(() => {
    dismissInstallPrompt();
    setShowModal(false);
    setVisible(false);
    setEligible(false);
  }, []);

  if (!appReady || isDashboard || !visible || !canShowUi || isStandaloneMode()) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] z-[10000] border-t border-slate-200/90 bg-white/95 p-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 ring-1 ring-slate-200/80">
            <Image
              src="/icon.png"
              alt={PWA_COPY.brandName}
              width={44}
              height={44}
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{PWA_COPY.bar.title}</p>
            <p className="truncate text-xs text-slate-500">{PWA_COPY.bar.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (canInstallNative) {
                void handleInstall();
                return;
              }
              setShowModal(true);
            }}
            disabled={installing}
            className="inline-flex shrink-0 items-center rounded-full bg-[#0f273b] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#153551] disabled:opacity-70"
          >
            <Download size={14} className="mr-1.5" />
            {installing ? PWA_COPY.installing : PWA_COPY.install}
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={PWA_COPY.dismiss}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[10050] flex items-end justify-center bg-black/50 p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] backdrop-blur-sm sm:items-center sm:pb-4 md:hidden">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="finderb-pwa-install-title"
            className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="bg-gradient-to-br from-[#0f273b] via-[#153551] to-[#1a4367] px-6 pb-8 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-white/30">
                    <Image
                      src="/icon.png"
                      alt=""
                      width={56}
                      height={56}
                      className="h-12 w-12 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-[#f9b864]">
                      {PWA_COPY.brandName}
                    </p>
                    <h2
                      id="finderb-pwa-install-title"
                      className="text-lg font-semibold leading-tight !text-white"
                    >
                      {PWA_COPY.modal.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLater}
                  className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label={PWA_COPY.later}
                >
                  <X size={18} />
                </button>
              </div>
              <p className="mt-4 text-sm leading-relaxed !text-white/90">{PWA_COPY.modal.subtitle}</p>
            </div>

            <div className="space-y-4 px-6 py-5">
              {isIosGuide ? (
                <ol className="space-y-3 text-sm text-slate-700">
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff4e3] text-[#c1621a]">
                      <Share size={14} />
                    </span>
                    <span>{PWA_COPY.ios.step1}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff4e3] text-[#c1621a]">
                      <Plus size={14} />
                    </span>
                    <span>{PWA_COPY.ios.step2}</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#fff4e3] text-[#c1621a]">
                      <Smartphone size={14} />
                    </span>
                    <span>{PWA_COPY.ios.step3}</span>
                  </li>
                </ol>
              ) : (
                <ul className="space-y-2 text-sm text-slate-600">
                  <li>• {PWA_COPY.benefit1}</li>
                  <li>• {PWA_COPY.benefit2}</li>
                  <li>• {PWA_COPY.benefit3}</li>
                </ul>
              )}

              {!isIosGuide && deferredPrompt ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleLater}
                    className="h-11 flex-1 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    {PWA_COPY.later}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleInstall()}
                    disabled={installing}
                    className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-[#0f273b] text-sm font-semibold text-white transition-colors hover:bg-[#153551] disabled:opacity-70"
                  >
                    <Download size={16} className="mr-1.5" />
                    {installing ? PWA_COPY.installing : PWA_COPY.installNow}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleLater}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  {PWA_COPY.later}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
