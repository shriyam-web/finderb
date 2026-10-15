'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import {
  acceptBusinessTeamInvite,
  previewBusinessTeamInvite,
  verifyBusinessTeamInviteOtpByToken,
} from '@/app/actions/businessTeam';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import { MerchantAuthMain, MerchantAuthPage } from '@/components/business/MerchantAuthShell';
import {
  MerchantAuthField,
  MerchantAuthFormBody,
  MerchantAuthFormCard,
  MerchantAuthFormHeader,
  MerchantAuthSubmitButton,
} from '@/components/business/MerchantAuthForm';

export default function BusinessTeamInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = decodeURIComponent(params.token || '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contact, setContact] = useState('');
  const [contactVerified, setContactVerified] = useState(false);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let cancelled = false;
    void previewBusinessTeamInvite(token).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setBusinessName(result.businessName);
      setContact(result.email || (result.mobile ? `+91 ${result.mobile}` : ''));
      setContactVerified(result.contactVerified);
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const verify = async (next = code) => {
    setSaving(true);
    setError('');
    const result = await verifyBusinessTeamInviteOtpByToken(token, next);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setContactVerified(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!contactVerified) {
      setError('Verify the 6-digit code before creating a password.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await acceptBusinessTeamInvite(token, password, code);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.replace('/business/dashboard');
  };

  return (
    <MerchantAuthPage>
      <MerchantAuthMain>
        <MerchantAuthFormCard>
          <MerchantAuthFormHeader
            title="Join this FinderB Business profile"
            subtitle={
              loading
                ? 'Checking your invite…'
                : businessName
                  ? `Use ${businessName} with ${contact || 'this invite'}. Verify the code, then create your own password.`
                  : error || 'This invite cannot be used.'
            }
          />
          <MerchantAuthFormBody>
            {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
            {businessName ? (
              <form onSubmit={(event) => void submit(event)} className="space-y-4">
                {!contactVerified ? (
                  <>
                    <div>
                      <p className="mb-2 text-sm font-medium text-zinc-800">6-digit code</p>
                      <OtpCodeBoxes
                        value={code}
                        onChange={setCode}
                        onComplete={(value) => {
                          setCode(value);
                          void verify(value);
                        }}
                        autoFocus
                        tone="neutral"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={saving || code.replace(/\D/g, '').length !== 6}
                      onClick={() => void verify()}
                      className="text-sm font-semibold text-[#215481]"
                    >
                      {saving ? 'Verifying…' : 'Verify code'}
                    </button>
                  </>
                ) : (
                  <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    {contact} is verified. Create a password to finish joining.
                  </p>
                )}
                <MerchantAuthField
                  id="invite-password"
                  label="Password"
                  type="password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Create a password"
                  icon={Lock}
                  autoComplete="new-password"
                />
                <MerchantAuthField
                  id="invite-confirm"
                  label="Confirm password"
                  type="password"
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="Confirm password"
                  icon={Lock}
                  autoComplete="new-password"
                />
                <MerchantAuthSubmitButton type="submit" loading={saving} disabled={loading || !contactVerified}>
                  Create password and continue
                </MerchantAuthSubmitButton>
                <p className="text-center text-xs text-zinc-500">Invites expire 48 hours after they are sent.</p>
              </form>
            ) : null}
          </MerchantAuthFormBody>
        </MerchantAuthFormCard>
      </MerchantAuthMain>
    </MerchantAuthPage>
  );
}
