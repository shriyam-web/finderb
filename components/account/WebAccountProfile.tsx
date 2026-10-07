'use client';

import { useState } from 'react';
import Image from 'next/image';
import { CldUploadWidget } from 'next-cloudinary';
import { Camera, CheckCircle2, Pencil, User as UserIcon } from 'lucide-react';
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

function uploadedUrl(result: unknown): string | null {
  const info = (result as { info?: { secure_url?: unknown } } | null)?.info;
  return typeof info?.secure_url === 'string' ? info.secure_url : null;
}

const rowClass = 'p-5';
const labelClass = 'block text-xs font-medium text-slate-500';
const inputClass =
  'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10';
const primaryBtn =
  'rounded-lg bg-[#215481] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#153551] disabled:cursor-not-allowed disabled:opacity-50';
const ghostBtn = 'rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800';

function EditLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-[#215481] hover:bg-[#215481]/5"
    >
      <Pencil size={13} />
      {label}
    </button>
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
            <p className="mt-1 text-sm text-slate-900">{name || 'Not added'}</p>
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
  const sent = cooldown.isSentTo(target);
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
    if (!target || unchanged || busy || wait > 0) return;
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
            <p className="mt-1 inline-flex max-w-full items-center gap-1.5 break-all text-sm text-slate-900">
              {current ? <CheckCircle2 size={14} className="shrink-0 text-emerald-500" /> : null}
              <span className={current ? '' : 'text-slate-400'}>{display}</span>
            </p>
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
                      autoFocus
                    />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={busy || wait > 0 || !target || unchanged}
                  className={`h-[2.625rem] shrink-0 rounded-lg px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    isEmail ? 'bg-[#215481] hover:bg-[#153551]' : 'bg-[#128C7E] hover:bg-[#0f7a6e]'
                  }`}
                >
                  {busy && !sent ? 'Sending…' : otpSendLabel(sent, wait > 0, wait)}
                </button>
              </div>
              {sent ? (
                <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-center text-[13px] text-slate-600">
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
                <p className="text-xs text-slate-500">
                  {isEmail
                    ? 'We will email a code to confirm the new address before saving it.'
                    : 'We will send a code on WhatsApp to confirm the new number before saving it.'}
                </p>
              )}
              <button type="button" onClick={reset} className={ghostBtn}>
                Cancel
              </button>
            </div>
          )}
          {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
          {locked && !editing ? <p className="mt-1 text-xs text-slate-400">{locked}</p> : null}
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
  const emailLocked = provider === 'google' ? 'Managed by your Google sign-in.' : undefined;
  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

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

  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200/80 bg-white">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
        <div className="relative h-20 w-20 shrink-0">
          {user.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt={name || 'Profile photo'}
              width={80}
              height={80}
              unoptimized
              className="h-20 w-20 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#215481] text-2xl font-semibold text-white">
              {name ? initialsOf(name) : <UserIcon size={30} />}
            </div>
          )}
          {photoBusy ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
            </div>
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold text-slate-900">{name || 'Your profile'}</p>
          {memberSince ? <p className="text-xs text-slate-400">Joined {memberSince}</p> : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {cloudName && uploadPreset ? (
              <CldUploadWidget
                uploadPreset={uploadPreset}
                onSuccess={(result) => {
                  const url = uploadedUrl(result);
                  if (url) void savePhoto(url);
                }}
                options={{
                  cloudName,
                  maxFiles: 1,
                  multiple: false,
                  sources: ['local', 'camera'],
                  resourceType: 'image',
                  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                  maxFileSize: 5_000_000,
                  cropping: true,
                  croppingAspectRatio: 1,
                  showSkipCropButton: false,
                }}
              >
                {({ open }) => (
                  <button
                    type="button"
                    onClick={() => open()}
                    disabled={photoBusy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#215481] transition hover:border-[#215481]/30 hover:bg-[#215481]/5 disabled:opacity-50"
                  >
                    <Camera size={15} />
                    {user.avatarUrl ? 'Change photo' : 'Add photo'}
                  </button>
                )}
              </CldUploadWidget>
            ) : null}
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

      <NameRow key={`name-${name}`} name={name} save={save} />
      <VerifiedContactRow key={`email-${email}`} kind="email" current={email} locked={emailLocked} save={save} />
      <VerifiedContactRow key={`phone-${phone}`} kind="phone" current={phone} save={save} />
    </div>
  );
}
