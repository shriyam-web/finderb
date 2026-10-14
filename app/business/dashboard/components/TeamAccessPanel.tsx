'use client';

import { useEffect, useState } from 'react';
import {
  inviteBusinessTeamMember,
  listBusinessTeam,
  resendBusinessTeamInvite,
  revokeBusinessTeamMember,
} from '@/app/actions/businessTeam';
import { dashboard } from './dashboard-ui';

type Member = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: 'pending' | 'active' | 'revoked';
  lastInviteSentAt: string | null;
  acceptedAt: string | null;
};

export default function TeamAccessPanel({ businessId }: { businessId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const result = await listBusinessTeam(businessId);
    if (result.success) setMembers(result.members);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const invite = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await inviteBusinessTeamMember(businessId, { email, mobile });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setEmail('');
    setMobile('');
    setMessage(result.warning || 'Invite sent. They stay pending until they set a password.');
    await load();
  };

  const resend = async (memberId: string) => {
    setBusy(true);
    setError('');
    const result = await resendBusinessTeamInvite(businessId, memberId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage(result.warning || 'Invite sent again.');
    await load();
  };

  const revoke = async (memberId: string) => {
    setBusy(true);
    const result = await revokeBusinessTeamMember(businessId, memberId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  return (
    <section>
      <h2 className={dashboard.sectionTitle}>Team access</h2>
      <div className={`mt-2 space-y-4 ${dashboard.panel} px-4 py-4`}>
        <p className="text-xs text-zinc-500">
          Invite extra email addresses or mobile numbers to the same business. They must open the
          invite and create a password before they can sign in. Pending means they have not accepted yet.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
          <input
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="Mobile"
            className="rounded-lg border border-zinc-200 px-3 py-2 text-sm"
          />
        </div>
        <button type="button" disabled={busy} onClick={() => void invite()} className={dashboard.btnPrimary}>
          Send invite
        </button>
        {error ? <p className="text-xs text-rose-700">{error}</p> : null}
        {message ? <p className="text-xs text-emerald-700">{message}</p> : null}
        <ul className="divide-y divide-zinc-100">
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center gap-2 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-900">
                  {[member.email, member.mobile ? `+91 ${member.mobile}` : ''].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-zinc-500">
                  {member.status === 'active' ? 'Active' : 'Pending invite'}
                </p>
              </div>
              {member.status === 'pending' ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void resend(member.id)}
                  className="text-xs font-semibold text-[#215481]"
                >
                  Resend invitation
                </button>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => void revoke(member.id)}
                className="text-xs font-semibold text-rose-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
