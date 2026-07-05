'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginBusiness } from '@/app/actions/business';
import { useRouter } from 'next/navigation';
import AuthRedirectScreen from '@/components/auth/AuthRedirectScreen';
import { useAlreadyLoggedInRedirect } from '@/hooks/useAlreadyLoggedInRedirect';
import { MerchantAuthMain, MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import {
  MerchantAuthField,
  MerchantAuthFormAltLink,
  MerchantAuthFormBody,
  MerchantAuthFormCard,
  MerchantAuthFormHeader,
  MerchantAuthSubmitButton,
} from '@/components/business/MerchantAuthForm';

export default function BusinessLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedLoginPath, setSuggestedLoginPath] = useState('');
  const router = useRouter();
  const authRedirect = useAlreadyLoggedInRedirect({ kind: 'business' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    setSuggestedLoginPath('');

    try {
      const result = await loginBusiness(email, password);

      if (result.success) {
        const destination = result.businessId
          ? `/business/dashboard?id=${result.businessId}`
          : '/business/dashboard';

        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('finderb-session-change', { detail: { type: 'business' } })
          );
        }

        router.refresh();
        router.replace(destination);
      } else {
        setError(result.error || 'Login failed');
        setSuggestedLoginPath(result.suggestedLoginPath || '');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (authRedirect.status === 'checking') {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center bg-[#eef3f9] pt-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
      </div>
    );
  }

  if (authRedirect.status === 'redirecting') {
    return <AuthRedirectScreen message={authRedirect.message} />;
  }

  return (
    <MerchantAuthPage>
      <section className="register-hero relative overflow-hidden pb-16 sm:pb-20 lg:pb-24">
        <div className="register-hero-bg pointer-events-none absolute inset-0" aria-hidden />
        <div
          className="pointer-events-none absolute -left-32 top-20 h-96 w-96 rounded-full bg-[#f9b864]/15 blur-[100px]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#215481]/12 blur-[90px]"
          aria-hidden
        />

        <MerchantAuthMain className="relative z-10">
          <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[1fr_minmax(0,400px)] lg:items-start lg:gap-x-12 xl:grid-cols-[1.05fr_minmax(0,420px)] xl:gap-x-16">
            <div className="max-w-xl lg:col-start-1 lg:row-start-1">
              <h1 className="text-[2rem] font-extrabold leading-[1.1] tracking-tight text-[#0a1520] sm:text-4xl lg:text-[2.75rem]">
                Welcome back to your{' '}
                <span className="register-hero-headline-accent">partner dashboard</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-[#3d4f63] sm:text-lg">
                Manage your listing, respond to leads, track reviews, and complete verification —
                everything your business needs in one place.
              </p>

              <ul className="mt-8 space-y-3.5">
                {[
                  'Update listing, photos, and business hours',
                  'View and reply to customer enquiries',
                  'Track growth and complete KYC verification',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm font-medium text-[#3d4f63] sm:text-[15px]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f9b864]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mx-auto w-full max-w-md lg:col-start-2 lg:row-start-1 lg:mx-0 lg:max-w-none lg:sticky lg:top-28">
              <MerchantAuthFormCard>
                <MerchantAuthFormHeader
                  title="Partner sign in"
                  subtitle="Use the email and password from your business registration."
                />
                <MerchantAuthFormBody>

                  {error && (
                    <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3.5 text-sm text-red-700">
                      <AlertCircle size={18} className="mt-0.5 shrink-0" />
                      <div>
                        <p>{error}</p>
                        {suggestedLoginPath && (
                          <Link
                            href={suggestedLoginPath}
                            className="mt-2 inline-flex font-semibold text-[#215481] underline-offset-2 hover:underline"
                          >
                            Go to the correct sign-in page
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleLogin} className="space-y-4">
                    <MerchantAuthField
                      id="email"
                      label="Work email"
                      type="email"
                      value={email}
                      onChange={setEmail}
                      placeholder="you@business.com"
                      icon={Mail}
                      autoComplete="email"
                    />

                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="password" className="merchant-auth-label mb-0">
                          Password
                        </label>
                        <Link
                          href="#"
                          className="text-xs font-medium text-[#215481] hover:text-[#153551] hover:underline"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <MerchantAuthField
                        id="password"
                        label="Password"
                        hideLabel
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={setPassword}
                        placeholder="Your password"
                        icon={Lock}
                        autoComplete="current-password"
                        trailing={
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition-colors hover:text-[#153551]"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                          </button>
                        }
                      />
                    </div>

                    <div className="pt-1">
                      <MerchantAuthSubmitButton type="submit" loading={loading}>
                        Sign in
                      </MerchantAuthSubmitButton>
                    </div>
                  </form>

                  <MerchantAuthFormAltLink
                    prompt="New to FinderB?"
                    href="/business/register"
                    linkText="Register your business"
                  />
                </MerchantAuthFormBody>
              </MerchantAuthFormCard>
            </div>
          </div>
        </MerchantAuthMain>
      </section>
    </MerchantAuthPage>
  );
}
