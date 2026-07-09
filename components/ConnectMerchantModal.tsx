'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { submitBroadcastEnquiry } from '@/app/actions/leads';
import type { ContactIntent } from '@/lib/directLead';
import { buildLoginHref, buildSignupHref } from '@/lib/authRedirect';

export type ConnectMerchantBusiness = {
  id: string;
  name: string;
  category: string;
  contact: string;
  whatsappNumber?: string | null;
  city?: string | null;
  location?: string;
};

type ModalStep = 'options' | 'form' | 'done';

type ConnectMerchantModalProps = {
  business: ConnectMerchantBusiness;
  isOpen: boolean;
  onClose: () => void;
  initialLookingFor?: string;
  contactRevealed: boolean;
  profileRedirectPath: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onContactAction: (intent: ContactIntent) => void | Promise<void>;
  initialStep?: ModalStep;
};

export default function ConnectMerchantModal({
  business,
  isOpen,
  onClose,
  initialLookingFor = '',
  contactRevealed,
  profileRedirectPath,
  userName = '',
  userEmail = '',
  userPhone = '',
  onContactAction,
  initialStep = 'options',
}: ConnectMerchantModalProps) {
  const [step, setStep] = useState<ModalStep>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merchantCount, setMerchantCount] = useState(0);
  const [lookingFor, setLookingFor] = useState(initialLookingFor);

  const area = (business.city || business.location || '').trim();
  const areaUnavailable =
    !area || /not specified|unknown/i.test(area) || (!business.city && !business.location);
  const loginHref = buildLoginHref(profileRedirectPath);
  const signupHref = buildSignupHref(profileRedirectPath);

  useEffect(() => {
    if (isOpen) {
      setLookingFor(initialLookingFor);
      setStep(initialStep);
      setError(null);
    }
  }, [isOpen, initialLookingFor, initialStep]);

  const handleClose = () => {
    setStep('options');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleContactClick = async (intent: ContactIntent) => {
    if (!contactRevealed) return;
    await onContactAction(intent);
    if (intent !== 'enquire') {
      handleClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contactRevealed) return;

    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitBroadcastEnquiry({
      sourceBusinessId: business.id,
      category: business.category,
      area,
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      lookingFor: formData.get('lookingFor') as string,
    });

    if (result.success) {
      setMerchantCount(result.merchantCount ?? 0);
      setStep('done');
    } else {
      setError(result.error || 'Could not send enquiry. Please try again.');
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[10050] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4 pb-[calc(5.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-merchant-title"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-[420px] bg-white border border-gray-300 shadow-lg max-h-[min(78vh,640px)] sm:max-h-[min(92vh,640px)] flex flex-col rounded-t-sm sm:rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h2 id="connect-merchant-title" className="text-base font-semibold text-gray-900 truncate">
              {step === 'form' ? 'Send enquiry' : step === 'done' ? 'Enquiry sent' : `Contact ${business.name}`}
            </h2>
            {step === 'options' && (
              <p className="text-sm text-gray-600 mt-0.5">
                {contactRevealed
                  ? 'Choose how you want to reach them.'
                  : 'Sign in to view contact options.'}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="shrink-0 text-gray-500 hover:text-gray-800 text-xl leading-none px-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="px-4 py-4 overflow-y-auto flex-1">
          {!contactRevealed && step !== 'done' && (
            <div className="mb-4 rounded-lg border border-[#f9b864]/30 bg-[#fff8ef] px-3 py-3 text-sm text-stone-700">
              <p>Sign in to call, WhatsApp, or send an enquiry. We&apos;ll bring you back here and count you as a lead for the merchant.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={loginHref}
                  className="inline-flex rounded-md bg-[#215481] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1a4367]"
                >
                  Sign in
                </Link>
                <Link
                  href={signupHref}
                  className="inline-flex rounded-md border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#215481] hover:bg-stone-50"
                >
                  Create account
                </Link>
              </div>
            </div>
          )}

          {step === 'options' && (
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  type="button"
                  disabled={!contactRevealed}
                  onClick={() => void handleContactClick('whatsapp')}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-left text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  WhatsApp
                </button>
              </li>
              <li>
                <button
                  type="button"
                  disabled={!contactRevealed}
                  onClick={() => void handleContactClick('call')}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-left text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {contactRevealed ? `Phone — ${business.contact}` : 'Phone — sign in to view'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  disabled={!contactRevealed || areaUnavailable}
                  onClick={async () => {
                    await onContactAction('enquire');
                    setStep('form');
                  }}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-left text-gray-900 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send enquiry to merchants in {business.category}
                  {area ? ` (${area})` : ''}
                </button>
              </li>
            </ul>
          )}

          {step === 'form' && (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Your details go to {business.name} and other {business.category} merchants in this
                area.
              </p>

              <form key={`${userName}-${userEmail}-${userPhone}`} onSubmit={handleSubmit} className="space-y-3">
                {error && (
                  <p className="text-sm text-red-700 border border-red-200 bg-red-50 px-3 py-2">
                    {error}
                  </p>
                )}

                <div>
                  <label htmlFor="enquiry-name" className="block text-sm text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    id="enquiry-name"
                    name="name"
                    type="text"
                    required
                    defaultValue={userName}
                    autoComplete="name"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-email" className="block text-sm text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="enquiry-email"
                    name="email"
                    type="email"
                    required
                    defaultValue={userEmail}
                    autoComplete="email"
                    readOnly={Boolean(userEmail)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm focus:outline-none focus:border-gray-500 read-only:bg-gray-50"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-phone" className="block text-sm text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    id="enquiry-phone"
                    name="phone"
                    type="tel"
                    required
                    defaultValue={userPhone}
                    autoComplete="tel"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="enquiry-looking-for" className="block text-sm text-gray-700 mb-1">
                    What are you looking for?
                  </label>
                  <textarea
                    id="enquiry-looking-for"
                    name="lookingFor"
                    required
                    rows={3}
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setStep('options')}
                    className="flex-1 border border-gray-300 px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !contactRevealed}
                    className="flex-[2] bg-[#215481] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1a4367] disabled:opacity-50"
                  >
                    {loading ? 'Sending…' : 'Send enquiry'}
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-sm text-gray-700">
              <p className="font-medium text-gray-900">Your enquiry was sent.</p>
              <p className="mt-2">
                {merchantCount > 0
                  ? `${merchantCount} merchant${merchantCount === 1 ? '' : 's'} in your area received it.`
                  : 'Merchants in your area will be notified.'}
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-4 w-full border border-gray-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
