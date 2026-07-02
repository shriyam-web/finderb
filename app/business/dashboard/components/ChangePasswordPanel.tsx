'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { changeBusinessPassword, verifyBusinessCurrentPassword } from '@/app/actions/business';
import {
  PASSWORD_MIN_LENGTH_USER,
  PASSWORD_MAX_LENGTH,
  validateChangePasswordFields,
} from '@/lib/security/passwordPolicy';
import { dashboard } from './dashboard-ui';

type ChangePasswordPanelProps = {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
};

type Step = 'current' | 'new';

function PasswordField({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-zinc-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={id === 'current-password' ? 'current-password' : 'new-password'}
          maxLength={PASSWORD_MAX_LENGTH}
          autoFocus={autoFocus}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#215481] focus:ring-2 focus:ring-[#215481]/10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-zinc-400 hover:text-zinc-700"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPanel({
  businessId,
  onSuccess,
  onCancel,
}: ChangePasswordPanelProps) {
  const [step, setStep] = useState<Step>('current');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const handleContinue = async () => {
    if (!currentPassword.trim()) {
      setError('Enter your current password.');
      return;
    }

    setVerifying(true);
    setError('');

    const result = await verifyBusinessCurrentPassword(businessId, currentPassword);
    setVerifying(false);

    if (!result.success) {
      setError(result.error || 'Current password is incorrect.');
      return;
    }

    setStep('new');
  };

  const handleSave = async () => {
    const validationError = validateChangePasswordFields({
      newPassword,
      confirmPassword,
      minLength: PASSWORD_MIN_LENGTH_USER,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');

    const result = await changeBusinessPassword(businessId, {
      currentPassword,
      newPassword,
      confirmPassword,
    });

    setSaving(false);

    if (!result.success) {
      if (result.error?.toLowerCase().includes('current password')) {
        setStep('current');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
      setError(result.error || 'Could not update password.');
      return;
    }

    onSuccess();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {step === 'current' ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-600">
              Enter your current password to continue. You&apos;ll set a new password on the next
              step.
            </p>
            <PasswordField
              id="current-password"
              label="Current password"
              value={currentPassword}
              onChange={(value) => {
                setCurrentPassword(value);
                if (error) setError('');
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-zinc-600">
              Choose a new password with at least {PASSWORD_MIN_LENGTH_USER} characters.
            </p>
            <PasswordField
              id="new-password"
              label="New password"
              value={newPassword}
              onChange={(value) => {
                setNewPassword(value);
                if (error) setError('');
              }}
              autoFocus
            />
            <PasswordField
              id="confirm-password"
              label="Confirm new password"
              value={confirmPassword}
              onChange={(value) => {
                setConfirmPassword(value);
                if (error) setError('');
              }}
            />
            <p className="text-xs text-zinc-500">
              Must be {PASSWORD_MIN_LENGTH_USER}–{PASSWORD_MAX_LENGTH} characters.
            </p>
          </div>
        )}

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
            {error}
          </p>
        )}
      </div>

      <div className="flex gap-2 border-t border-zinc-100 px-5 py-4">
        {step === 'current' ? (
          <>
            <button type="button" onClick={onCancel} className={`flex-1 ${dashboard.btnSecondary}`}>
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleContinue()}
              disabled={verifying}
              className={`flex-[2] ${dashboard.btnPrimary} disabled:opacity-50`}
            >
              {verifying ? 'Checking…' : 'Continue'}
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                setStep('current');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
              }}
              className={`flex-1 ${dashboard.btnSecondary}`}
              disabled={saving}
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className={`flex-[2] ${dashboard.btnPrimary} disabled:opacity-50`}
            >
              {saving ? 'Saving…' : 'Save password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
