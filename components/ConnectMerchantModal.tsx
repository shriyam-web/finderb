'use client';

import { useEffect, useState } from 'react';
import { submitBroadcastEnquiry } from '@/app/actions/leads';

export type ConnectMerchantBusiness = {
  id: string;
  name: string;
  category: string;
  contact: string;
  whatsappNumber?: string | null;
  city?: string | null;
  location?: string;
};

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}

function whatsAppUrl(number: string, businessName: string) {
  const digits = digitsOnly(number);
  const withCountry = digits.length === 10 ? `91${digits}` : digits;
  const text = encodeURIComponent(
    `Hi, I found ${businessName} on FinderB and would like to know more.`
  );
  return `https://wa.me/${withCountry}?text=${text}`;
}

type ModalStep = 'options' | 'form' | 'done';

export default function ConnectMerchantModal({
  business,
  isOpen,
  onClose,
  initialLookingFor = '',
}: {
  business: ConnectMerchantBusiness;
  isOpen: boolean;
  onClose: () => void;
  initialLookingFor?: string;
}) {
  const [step, setStep] = useState<ModalStep>('options');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merchantCount, setMerchantCount] = useState(0);
  const [lookingFor, setLookingFor] = useState(initialLookingFor);

  const area = (business.city || business.location || '').trim();
  const areaUnavailable =
    !area || /not specified|unknown/i.test(area) || (!business.city && !business.location);
  const whatsapp = business.whatsappNumber || business.contact;

  useEffect(() => {
    if (isOpen) {
      setLookingFor(initialLookingFor);
    }
  }, [isOpen, initialLookingFor]);

  const handleClose = () => {
    setStep('options');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="connect-merchant-title"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-[420px] bg-white border border-gray-300 shadow-lg max-h-[min(92vh,640px)] flex flex-col sm:rounded-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-gray-200 shrink-0">
          <div className="min-w-0">
            <h2 id="connect-merchant-title" className="text-base font-semibold text-gray-900 truncate">
              {step === 'form' ? 'Send enquiry' : step === 'done' ? 'Enquiry sent' : `Contact ${business.name}`}
            </h2>
            {step === 'options' && (
              <p className="text-sm text-gray-600 mt-0.5">Choose how you want to reach them.</p>
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
          {step === 'options' && (
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href={whatsAppUrl(whatsapp, business.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleClose}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-gray-900 hover:bg-gray-50"
                >
                  WhatsApp
                </a>
              </li>
              <li>
                <a
                  href={`tel:${business.contact}`}
                  onClick={handleClose}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-gray-900 hover:bg-gray-50"
                >
                  Phone — {business.contact}
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="block w-full border border-gray-300 px-3 py-2.5 text-left text-gray-900 hover:bg-gray-50"
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

              <form onSubmit={handleSubmit} className="space-y-3">
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
                    autoComplete="email"
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm focus:outline-none focus:border-gray-500"
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
                    rows={4}
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 rounded-sm resize-y min-h-[88px] focus:outline-none focus:border-gray-500"
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('options');
                      setError(null);
                    }}
                    className="w-full sm:w-auto border border-gray-300 px-4 py-2 text-sm text-gray-800 hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || areaUnavailable}
                    className="w-full sm:flex-1 bg-[#1a56db] text-white px-4 py-2 text-sm hover:bg-[#1648b8] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending…' : 'Submit enquiry'}
                  </button>
                </div>

                {areaUnavailable && (
                  <p className="text-sm text-amber-800">
                    Area is not set for this listing. Use WhatsApp or phone instead.
                  </p>
                )}
              </form>
            </>
          )}

          {step === 'done' && (
            <div className="text-sm text-gray-700 space-y-3">
              <p>
                Your enquiry was sent to <strong>{merchantCount}</strong> merchant
                {merchantCount === 1 ? '' : 's'}.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="w-full border border-gray-300 px-4 py-2 text-gray-900 hover:bg-gray-50"
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
