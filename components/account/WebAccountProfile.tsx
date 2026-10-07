'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { BadgeCheck, Camera, Pencil, User as UserIcon } from 'lucide-react';
import AvatarCropModal from '@/components/account/AvatarCropModal';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import { otpSendLabel, useOtpCooldown } from '@/hooks/useOtpCooldown';
import { extractIndianMobileDigits, formatIndianMobileDisplay } from '@/lib/indianPhone';
import { isSyntheticLoginEmail } from '@/lib/syntheticLoginEmail';
import { confirmUserEmailOtp, sendUserEmailOtp } from '@/app/actions/emailOtp';
import {
  confirmMyPhoneOtp,
  sendMyPhoneOtp,
  updateMyProfile,
  uploadMyAvatar,
  type WebProfilePatch,
} from '@/app/actions/userProfile';

export type WebAccountUser = {
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  authProvider?: string | null;
  createdAt?: string | null;
};

type SaveResult = { ok: true } | { ok: false; error: string };

function initialsOf(name: string) {
  return (
    name
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'U'
  );
}

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const rowClass = 'px-5 py-4 sm:px-6';
const labelClass = 'block text-xs font-medium uppercase tracking-wide text-zinc-400';
const inputClass =
  'w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-4 focus:ring-zinc-900/5';
const primaryBtn =
  'rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40';
const ghostBtn =
  'rounded-xl px-3 py-2 text-sm font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900';

function EditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900"
    >
      <Pencil size={12} />
      {label}
    </button>
  );
}

function VerifiedTag() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
      <BadgeCheck size={12} />
      Verified
    </span>
  );
}

function NameRow({ name, save }: { name: string; save: (patch: WebProfilePatch) => Promise<SaveResult> }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    const result = await save({ fullName: value.trim() });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setEditing(false);
  };

  return (
    <div className={rowClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="account-name" className={labelClass}>
            Full name
          </label>
          {editing ? (
            <div className="mt-2 space-y-3">
              <input
                id="account-name"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoComplete="name"
                autoFocus
                className={inputClass}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => void submit()}
                  disabled={busy || value.trim().length < 2 || value.trim() === name}
                  className={primaryBtn}
                >
                  {busy ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setValue(name);
                    setError('');
                  }}
                  className={ghostBtn}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 text-[15px] font-medium text-zinc-900">{name || 'Not added'}</p>
          )}
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
        </div>
        {editing ? null : <EditLink label="Edit" onClick={() => setEditing(true)} />}
      </div>
    </div>
  );
}

type OtpRowProps = {
  kind: 'email' | 'phone';
  current: string;
  locked?: string;
  save: (patch: WebProfilePatch) => Promise<SaveResult>;
};

function VerifiedContactRow({ kind, current, locked, save }: OtpRowProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const cooldown = useOtpCooldown();
  const isEmail = kind === 'email';
  const target = isEmail ? value.trim().toLowerCase() : extractIndianMobileDigits(value);
  const unchanged = target === current;
  const valid = isEmail ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(target) : /^[6-9]\d{9}$/.test(target);
  const looksComplete = isEmail ? target.includes('@') : target.length === 10;
  const formatError =
    looksComplete && !valid
      ? isEmail
        ? 'Enter a valid email address.'
        : 'Enter a valid 10-digit Indian mobile number.'
      : '';
  const canSend = Boolean(target) && !unchanged;
  const sent = canSend && cooldown.isSentTo(target);
  const wait = cooldown.isWaiting(target) ? cooldown.secondsLeft : 0;
  const label = isEmail ? 'Email' : 'Mobile number';

  const reset = () => {
    setEditing(false);
    setValue(current);
    setCode('');
    setError('');
    setHint('');
    cooldown.clearSent();
  };

  const send = async () => {
    if (!valid || unchanged || busy || wait > 0) return;
    setBusy(true);
    setError('');
    setHint('');
    try {
      const result = isEmail ? await sendUserEmailOtp(target) : await sendMyPhoneOtp(target);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setCode('');
      setHint(result.message);
      cooldown.markSent(target);
    } catch {
      setError('Could not send the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async (entered = code) => {
    if (entered.length !== 6 || busy) return;
    setBusy(true);
    setError('');
    try {
      let patch: WebProfilePatch;
      if (isEmail) {
        const result = await confirmUserEmailOtp(target, entered);
        if (!result.success) {
          setCode('');
          setError(result.error);
          return;
        }
        patch = { email: target, emailVerificationToken: result.emailVerificationToken };
      } else {
        const result = await confirmMyPhoneOtp(target, entered);
        if (!result.success) {
          setCode('');
          setError(result.error);
          return;
        }
        patch = { phone: result.phone, phoneVerificationToken: result.phoneVerificationToken };
      }
      const saved = await save(patch);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      cooldown.clearSent();
      setCode('');
      setHint('');
      setEditing(false);
    } catch {
      setError('Could not verify the code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const display = current ? (isEmail ? current : `+91 ${formatIndianMobileDisplay(current)}`) : 'Not added';

  return (
    <div className={rowClass}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={`account-${kind}`} className={labelClass}>
            {label}
          </label>
          {!editing ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <span
                className={`break-all text-[15px] font-medium ${current ? 'text-zinc-900' : 'text-zinc-400'}`}
              >
                {display}
              </span>
              {current ? <VerifiedTag /> : null}
            </div>
          ) : (
            <div className="mt-2 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="min-w-0 flex-1">
                  {isEmail ? (
                    <input
                      id="account-email"
                      type="email"
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value);
                        setError('');
                      }}
                      placeholder="you@example.com"
                      autoComplete="email"
                      autoFocus
                      className={inputClass}
                    />
                  ) : (
                    <IndianPhoneInput
                      id="account-phone"
                      value={value}
                      onChange={(digits) => {
                        setValue(digits);
                        setError('');
                      }}
                      variant="account"
                      autoFocus
                    />
                  )}
                </div>
                {canSend ? (
                  <button
                    type="button"
                    onClick={() => void send()}
                    disabled={busy || wait > 0 || !valid}
                    className={`h-[2.75rem] shrink-0 rounded-xl px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40 ${
                      isEmail ? 'bg-zinc-900 hover:bg-zinc-800' : 'bg-[#128C7E] hover:bg-[#0f7a6e]'
                    }`}
                  >
                    {busy && !sent ? 'Sending…' : otpSendLabel(sent, wait > 0, wait)}
                  </button>
                ) : null}
              </div>
              {formatError ? <p className="text-xs font-medium text-amber-700">{formatError}</p> : null}
              {sent ? (
                <div className="space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-center text-[13px] text-zinc-600">
                    {hint ||
                      (isEmail
                        ? 'Enter the 6-digit code we emailed you.'
                        : 'Enter the 6-digit code we sent on WhatsApp.')}
                  </p>
                  <OtpCodeBoxes
                    value={code}
                    onChange={(next) => {
                      setCode(next);
                      setError('');
                    }}
                    onComplete={(next) => void verify(next)}
                    disabled={busy}
                    tone={isEmail ? 'neutral' : 'whatsapp'}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => void verify()}
                    disabled={busy || code.length !== 6}
                    className={`w-full ${primaryBtn}`}
                  >
                    {busy ? 'Verifying…' : 'Verify & save'}
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-500">
                  {unchanged && current
                    ? `Enter a new ${isEmail ? 'email address' : 'mobile number'} to change it.`
                    : isEmail
                      ? 'We will email a code to confirm this address before saving it.'
                      : 'We will send a code on WhatsApp to confirm this number before saving it.'}
                </p>
              )}
              <button type="button" onClick={reset} className={ghostBtn}>
                Cancel
              </button>
            </div>
          )}
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          {locked && !editing ? <p className="mt-1 text-xs text-zinc-400">{locked}</p> : null}
        </div>
        {editing || locked ? null : (
          <EditLink label={current ? 'Change' : 'Add'} onClick={() => setEditing(true)} />
        )}
      </div>
    </div>
  );
}

export default function WebAccountProfile({
  user,
  onUserChange,
}: {
  user: WebAccountUser;
  onUserChange: (patch: Partial<WebAccountUser>) => void;
}) {
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const name = String(user.fullName || '').trim();
  const rawEmail = String(user.email || '').trim().toLowerCase();
  const email = isSyntheticLoginEmail(rawEmail) ? '' : rawEmail;
  const phone = extractIndianMobileDigits(user.phone || '');
  const provider = String(user.authProvider || '').toLowerCase();
  const emailLocked = provider === 'google' ? "Can't be updated as you have registered your account with this Google email." : undefined;
  const phoneLocked =
    phone && (provider === 'truecaller' || provider.includes('whatsapp'))
      ? "Can't be updated as you have registered your account with this number."
      : undefined;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const fileInput = useRef<HTMLInputElement>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropError, setCropError] = useState('');

  const save = async (patch: WebProfilePatch): Promise<SaveResult> => {
    try {
      const result = await updateMyProfile(patch);
      if (!result.success) return { ok: false, error: result.error };
      onUserChange(result.user);
      return { ok: true };
    } catch {
      return { ok: false, error: 'Could not save. Please try again.' };
    }
  };

  const savePhoto = async (avatarUrl: string | null) => {
    setPhotoBusy(true);
    setPhotoError('');
    const result = await save({ avatarUrl });
    setPhotoBusy(false);
    if (!result.ok) setPhotoError(result.error);
  };

  const pickPhoto = (file: File | undefined) => {
    if (!file) return;
    if (!PHOTO_TYPES.includes(file.type)) {
      setPhotoError('Choose a JPG, PNG or WebP photo.');
      return;
    }
    if (file.size > 15_000_000) {
      setPhotoError('This photo is too large. Choose one under 15 MB.');
      return;
    }
    setPhotoError('');
    setCropError('');
    setCropFile(file);
  };

  const uploadCropped = async (dataUri: string) => {
    setPhotoBusy(true);
    setCropError('');
    try {
      const result = await uploadMyAvatar(dataUri);
      if (!result.success) {
        setCropError(result.error);
        return;
      }
      onUserChange(result.user);
      setCropFile(null);
    } catch {
      setCropError('Could not upload the photo. Please try again.');
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <div className="relative h-20 w-20 shrink-0">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={name || 'Profile photo'}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-full object-cover ring-1 ring-zinc-200"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-zinc-100 text-2xl font-semibold text-zinc-700 ring-1 ring-zinc-200">
              {name ? initialsOf(name) : <UserIcon size={30} />}
            </div>
          )}
          {photoBusy ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-zinc-900">{name || 'Your profile'}</p>
          {memberSince ? <p className="text-sm text-zinc-500">Member since {memberSince}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              ref={fileInput}
              type="file"
              accept={PHOTO_TYPES.join(',')}
              className="hidden"
              onChange={(event) => {
                pickPhoto(event.target.files?.[0]);
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={photoBusy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Camera size={15} />
              {user.avatarUrl ? 'Change photo' : 'Add photo'}
            </button>
            {user.avatarUrl ? (
              <button
                type="button"
                onClick={() => void savePhoto(null)}
                disabled={photoBusy}
                className={ghostBtn}
              >
                Remove
              </button>
            ) : null}
          </div>
          {photoError ? <p className="mt-2 text-xs text-red-600">{photoError}</p> : null}
        </div>
      </div>

      <div className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
        <NameRow key={`name-${name}`} name={name} save={save} />
        <VerifiedContactRow key={`email-${email}`} kind="email" current={email} locked={emailLocked} save={save} />
        <VerifiedContactRow key={`phone-${phone}`} kind="phone" current={phone} locked={phoneLocked} save={save} />
      </div>

      {cropFile ? (
        <AvatarCropModal
          file={cropFile}
          busy={photoBusy}
          error={cropError}
          onCancel={() => setCropFile(null)}
          onConfirm={(dataUri) => void uploadCropped(dataUri)}
        />
      ) : null}
    </div>
  );
}
