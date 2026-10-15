'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { acceptBusinessTeamInvite, previewBusinessTeamInvite } from '@/app/actions/businessTeam';
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
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    const result = await acceptBusinessTeamInvite(token, password);
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
                  ? `Use ${businessName} with ${contact || 'this invite'}. Create your own password to continue.`
                  : error || 'This invite cannot be used.'
            }
          />
          <MerchantAuthFormBody>
            {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
            {businessName ? (
              <form onSubmit={(event) => void submit(event)} className="space-y-4">
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
                <MerchantAuthSubmitButton type="submit" loading={saving} disabled={loading}>
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
