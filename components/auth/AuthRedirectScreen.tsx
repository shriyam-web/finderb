import { CheckCircle2 } from 'lucide-react';

type AuthRedirectScreenProps = {
  message: string;
  className?: string;
};

export default function AuthRedirectScreen({ message, className = '' }: AuthRedirectScreenProps) {
  return (
    <div
      className={`flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] px-4 pt-24 sm:pt-28 md:pt-32 lg:pt-36 xl:pt-40 ${className}`}
    >
      <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 size={40} className="mx-auto text-emerald-600" aria-hidden />
        <p className="mt-4 text-lg font-semibold text-[#0f273b]">{message}</p>
        <p className="mt-2 text-sm text-slate-500">Redirecting…</p>
        <div
          className="mx-auto mt-6 h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent"
          aria-hidden
        />
      </div>
    </div>
  );
}
