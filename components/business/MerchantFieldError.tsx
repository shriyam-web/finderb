import { AlertCircle } from 'lucide-react';

export function MerchantFieldError({
  id,
  message,
}: {
  id?: string;
  message?: string;
}) {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="merchant-auth-field-error mt-1.5 flex items-start gap-1.5 text-[13px] font-medium leading-snug text-[#be123c]"
    >
      <AlertCircle size={14} className="mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>{message}</span>
    </p>
  );
}

export function MerchantFormBanner({
  message,
}: {
  message?: string;
}) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="merchant-auth-form-banner
        mb-4 flex items-start gap-2 rounded-xl border border-rose-200/90 bg-rose-50/90 px-4 py-3 text-[13px] font-medium leading-snug text-[#9f1239]"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden />
      <span>{message}</span>
    </div>
  );
}
