'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteOwnAccount } from '@/app/actions/user';
import { LEGAL_COMPANY } from '@/lib/legalContent';
import { buildLoginHref } from '@/lib/authRedirect';

type Props = {
  signedIn: boolean;
  email?: string | null;
};

export default function DeleteAccountPanel({ signedIn, email }: Props) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = async () => {
    if (!canDelete || loading) return;
    setLoading(true);
    setError('');
    const result = await deleteOwnAccount();
    setLoading(false);
    if (!result.success) {
      setError(result.error || 'Could not delete your account.');
      return;
    }
    setDone(true);
    window.setTimeout(() => router.replace('/'), 1600);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-900">
        Your FinderB account has been deleted. We are taking you back to the homepage.
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
        <p>
          Sign in with the same email you use on FinderB (website or app), then confirm deletion on
          this page.
        </p>
        <Link
          href={buildLoginHref('/account-deletion')}
          className="inline-flex rounded-lg bg-[#215481] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#1a4367]"
        >
          Sign in to delete account
        </Link>
        <p className="text-sm text-neutral-500">
          You can also email{' '}
          <a className="underline" href={`mailto:${LEGAL_COMPANY.email}?subject=Account%20deletion`}>
            {LEGAL_COMPANY.email}
          </a>{' '}
          from your registered address with the subject “Account deletion”.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-red-200 bg-white p-5">
      <p>
        Signed in as <span className="font-medium text-neutral-900">{email}</span>. This permanently
        deletes your FinderB user account, saved places, and sign-in on the website and mobile app.
      </p>
      <p className="text-sm text-neutral-600">
        Public reviews already posted on business pages may remain in anonymised form. Merchant /
        business listings are separate accounts and are not removed here.
      </p>
      <label className="block text-sm font-medium text-neutral-800">
        Type DELETE to confirm
        <input
          value={confirmText}
          onChange={(event) => setConfirmText(event.target.value)}
          className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          autoComplete="off"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="button"
        onClick={() => void handleDelete()}
        disabled={!canDelete || loading}
        className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Deleting…' : 'Delete my account'}
      </button>
    </div>
  );
}
