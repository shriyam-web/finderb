'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineEnvelope,
  HiOutlineDevicePhoneMobile,
  HiOutlineShieldCheck,
  HiOutlineUserPlus,
  HiOutlineChevronLeft,
} from 'react-icons/hi2';
import {
  inviteBusinessTeamMember,
  listBusinessTeam,
  resendBusinessTeamInvite,
  revokeBusinessTeamMember,
  updateBusinessTeamAccess,
  verifyBusinessTeamInviteOtp,
} from '@/app/actions/businessTeam';
import TeamAccessMatrix from '@/components/business/TeamAccessMatrix';
import OtpCodeBoxes from '@/components/auth/OtpCodeBoxes';
import IndianPhoneInput from '@/components/IndianPhoneInput';
import {
  TEAM_INVITE_HOURS,
  defaultInviteAccess,
  summarizeTeamAccess,
  type TeamAccessMap,
  type TeamInviteChannel,
} from '@/lib/businessTeam/teamAccess';
import { dashboard } from './dashboard-ui';

type Member = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: 'pending' | 'active' | 'revoked' | 'expired';
  access: TeamAccessMap;
  contactVerified: boolean;
  lastInviteSentAt: string | null;
  acceptedAt: string | null;
  inviteExpiresAt: string | null;
};

type Step = 'list' | 'channel' | 'contact' | 'otp' | 'access';

function hoursLeft(member: Pick<Member, 'inviteExpiresAt' | 'lastInviteSentAt'>) {
  const fromExpiry = member.inviteExpiresAt ? new Date(member.inviteExpiresAt).getTime() : Number.POSITIVE_INFINITY;
  const fromSent = member.lastInviteSentAt
    ? new Date(member.lastInviteSentAt).getTime() + TEAM_INVITE_HOURS * 60 * 60 * 1000
    : Number.POSITIVE_INFINITY;
  const end = Math.min(fromExpiry, fromSent);
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
}

export default function TeamAccessPanel({ businessId }: { businessId: string }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [step, setStep] = useState<Step>('list');
  const [channel, setChannel] = useState<TeamInviteChannel>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [code, setCode] = useState('');
  const [access, setAccess] = useState<TeamAccessMap>(defaultInviteAccess);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const result = await listBusinessTeam(businessId);
    if (result.success) setMembers(result.members as Member[]);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const resetWizard = () => {
    setStep('list');
    setChannel('email');
    setEmail('');
    setMobile('');
    setCode('');
    setAccess(defaultInviteAccess());
    setDraftId(null);
    setError('');
  };

  const startInvite = () => {
    setError('');
    setMessage('');
    setAccess(defaultInviteAccess());
    setStep('channel');
  };

  const sendCode = async () => {
    setBusy(true);
    setError('');
    setMessage('');
    const result = await inviteBusinessTeamMember(businessId, {
      channel,
      email,
      mobile,
      access,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDraftId(result.member.id);
    setMessage(
      result.warning ||
        (channel === 'email'
          ? 'A 6-digit code was emailed. Enter it here if they are with you, or they can verify from the invite.'
          : 'A 6-digit WhatsApp code was sent. Enter it here if they are with you, or they can verify from the invite.'),
    );
    setStep('otp');
    await load();
  };

  const verifyCode = async (nextCode = code) => {
    if (!draftId) return;
    setBusy(true);
    setError('');
    const result = await verifyBusinessTeamInviteOtp(businessId, draftId, nextCode);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCode('');
    setStep('access');
    await load();
  };

  const saveAccess = async (memberId: string, next: TeamAccessMap, closeWizard = false) => {
    setBusy(true);
    setError('');
    const result = await updateBusinessTeamAccess(businessId, memberId, next);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setMessage('Access updated.');
    if (closeWizard) resetWizard();
    setEditingId(null);
    await load();
  };

  const finishInvite = async () => {
    if (!draftId) {
      resetWizard();
      return;
    }
    await saveAccess(draftId, access, true);
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
    setDraftId(memberId);
    setCode('');
    setStep('otp');
    setMessage(result.warning || 'A fresh code was sent. It expires in 48 hours.');
    await load();
  };

  const revoke = async (memberId: string) => {
    if (!window.confirm('Revoke this person’s access? They will not be able to sign in until you invite them again.')) {
      return;
    }
    setBusy(true);
    const result = await revokeBusinessTeamMember(businessId, memberId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (draftId === memberId) resetWizard();
    await load();
  };

  const contactLabel = channel === 'email' ? email : mobile ? `+91 ${mobile}` : '';
  const editingMember = useMemo(
    () => members.find((member) => member.id === editingId) || null,
    [members, editingId],
  );

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className={dashboard.sectionTitle}>Team access</h2>
          <p className={dashboard.sectionDesc}>
            Only you, the original owner, can invite people, change tab rights, or revoke access.
            Invites expire after {TEAM_INVITE_HOURS} hours if they are not accepted.
          </p>
        </div>
        {step === 'list' ? (
          <button type="button" onClick={startInvite} className={dashboard.btnPrimary}>
            <HiOutlineUserPlus className="h-4 w-4" />
            Invite teammate
          </button>
        ) : null}
      </div>

      {step !== 'list' ? (
        <div className={`mt-3 ${dashboard.panel} overflow-hidden`}>
          <div className={dashboard.accentBar} />
          <div className="px-4 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  if (step === 'channel') resetWizard();
                  else if (step === 'contact') setStep('channel');
                  else if (step === 'otp') setStep('contact');
                  else setStep('otp');
                }}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#215481]"
              >
                <HiOutlineChevronLeft className="h-4 w-4" />
                Back
              </button>
              <WizardSteps current={step} />
            </div>

            {step === 'channel' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">How should we send the invite?</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    We will send a one-time code to prove they own that inbox or phone, then you choose which tabs they can view or edit.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChannelCard
                    icon={HiOutlineEnvelope}
                    title="Email"
                    body="Send a 6-digit code and invite link to their email."
                    active={channel === 'email'}
                    onClick={() => setChannel('email')}
                  />
                  <ChannelCard
                    icon={HiOutlineDevicePhoneMobile}
                    title="Phone"
                    body="Send a WhatsApp verification code to an Indian mobile number."
                    active={channel === 'phone'}
                    onClick={() => setChannel('phone')}
                  />
                </div>
                <button type="button" onClick={() => setStep('contact')} className={dashboard.btnPrimary}>
                  Continue
                </button>
              </div>
            ) : null}

            {step === 'contact' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">
                    {channel === 'email' ? 'Enter their email' : 'Enter their mobile number'}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    They stay pending until the code is verified and they create a password. Unused invites cancel in {TEAM_INVITE_HOURS} hours.
                  </p>
                </div>
                {channel === 'email' ? (
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@business.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm"
                  />
                ) : (
                  <IndianPhoneInput id="team-invite-mobile" value={mobile} onChange={setMobile} />
                )}
                <button type="button" disabled={busy} onClick={() => void sendCode()} className={dashboard.btnPrimary}>
                  {busy ? 'Sending…' : 'Send verification code'}
                </button>
              </div>
            ) : null}

            {step === 'otp' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Verify the code</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    Sent to {contactLabel || 'them'}. If they are standing with you, enter the code now. Otherwise they can verify from the invite link.
                  </p>
                </div>
                <OtpCodeBoxes
                  value={code}
                  onChange={setCode}
                  onComplete={(value) => {
                    setCode(value);
                    if (draftId && value.length === 6) void verifyCode(value);
                  }}
                  autoFocus
                  tone="neutral"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy || code.length !== 6 || !draftId}
                    onClick={() => void verifyCode()}
                    className={dashboard.btnPrimary}
                  >
                    Verify code
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setStep('access')}
                    className={dashboard.btnSecondary}
                  >
                    They will verify themselves
                  </button>
                </div>
              </div>
            ) : null}

            {step === 'access' ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-zinc-900">Choose tab access</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    View lets them open the tab. Edit lets them change data on it. Team management always stays with you.
                  </p>
                </div>
                <TeamAccessMatrix access={access} onChange={setAccess} disabled={busy} />
                <button type="button" disabled={busy} onClick={() => void finishInvite()} className={dashboard.btnPrimary}>
                  {draftId ? 'Save access and finish' : 'Done'}
                </button>
              </div>
            ) : null}

            {error ? <p className="mt-3 text-xs text-rose-700">{error}</p> : null}
            {message ? <p className="mt-3 text-xs text-emerald-700">{message}</p> : null}
          </div>
        </div>
      ) : null}

      <div className={`mt-3 ${dashboard.panel} px-4 py-4`}>
        {error && step === 'list' ? <p className="mb-3 text-xs text-rose-700">{error}</p> : null}
        {message && step === 'list' ? <p className="mb-3 text-xs text-emerald-700">{message}</p> : null}
        {members.length === 0 ? (
          <p className="text-sm text-zinc-500">No teammates yet. Invite someone by email or phone to share this business console.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {members.map((member) => {
              const remaining = hoursLeft(member);
              const badge = memberStatusBadge(member, remaining);
              return (
                <li key={member.id} className="py-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">
                        {[member.email, member.mobile ? `+91 ${member.mobile}` : ''].filter(Boolean).join(' · ')}
                      </p>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.className}`}>
                        {badge.label}
                      </span>
                      <p className="mt-1 text-xs text-zinc-500">{summarizeTeamAccess(member.access)}</p>
                    </div>
                    {member.status === 'pending' || member.status === 'expired' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void resend(member.id)}
                        className="text-xs font-semibold text-[#215481]"
                      >
                        {member.status === 'expired' ? 'Invite again' : 'Resend'}
                      </button>
                    ) : null}
                    {member.status !== 'expired' ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          setEditingId(editingId === member.id ? null : member.id);
                          setError('');
                        }}
                        className="text-xs font-semibold text-[#215481]"
                      >
                        {editingId === member.id ? 'Close' : 'Edit access'}
                      </button>
                    ) : null}
                    {member.status !== 'expired' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void revoke(member.id)}
                      className="text-xs font-semibold text-rose-700"
                    >
                      Revoke
                    </button>
                    ) : null}
                  </div>
                  {editingMember?.id === member.id ? (
                    <div className="mt-3 space-y-3">
                      <TeamAccessMatrix
                        access={editingMember.access}
                        onChange={(next) =>
                          setMembers((current) =>
                            current.map((item) => (item.id === member.id ? { ...item, access: next } : item)),
                          )
                        }
                        disabled={busy}
                      />
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => void saveAccess(member.id, members.find((item) => item.id === member.id)?.access || member.access)}
                        className={dashboard.btnPrimary}
                      >
                        Save rights
                      </button>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-zinc-400">
          <HiOutlineShieldCheck className="h-3.5 w-3.5 text-[#215481]" />
          Teammates never receive owner-only rights such as inviting others or changing login email and password.
        </p>
      </div>
    </section>
  );
}

function WizardSteps({ current }: { current: Step }) {
  const items = [
    { id: 'channel', label: 'Send by' },
    { id: 'contact', label: 'Details' },
    { id: 'otp', label: 'Verify' },
    { id: 'access', label: 'Access' },
  ] as const;
  const index = items.findIndex((item) => item.id === current);
  return (
    <ol className="flex items-center gap-1.5">
      {items.map((item, itemIndex) => {
        const on = itemIndex <= index;
        return (
          <li key={item.id} className="flex items-center gap-1.5">
            <span
              className={`h-1.5 w-6 rounded-full ${on ? 'bg-[#215481]' : 'bg-zinc-200'} ${itemIndex === index ? 'bg-[#E8873A]' : ''}`}
            />
            <span className={`hidden text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline ${on ? 'text-[#215481]' : 'text-zinc-400'}`}>
              {item.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function memberStatusBadge(member: Member, remaining: number | null) {
  if (member.status === 'active') return { label: 'Active', className: 'bg-emerald-50 text-emerald-800' };
  if (member.status === 'expired') return { label: 'Cancelled · not accepted in 48 hours', className: 'bg-zinc-100 text-zinc-600' };
  if (member.contactVerified) return { label: 'Code verified · waiting for password', className: 'bg-sky-50 text-sky-800' };
  return {
    label: remaining ? `Pending · ${remaining}h left` : 'Pending invite',
    className: 'bg-amber-50 text-amber-800',
  };
}

function ChannelCard({
  icon: Icon,
  title,
  body,
  active,
  onClick,
}: {
  icon: typeof HiOutlineEnvelope;
  title: string;
  body: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border px-4 py-4 text-left transition ${
        active ? 'border-[#215481] bg-[#215481]/5 shadow-sm' : 'border-zinc-200 bg-white hover:border-zinc-300'
      }`}
    >
      <Icon className={`h-5 w-5 ${active ? 'text-[#215481]' : 'text-zinc-400'}`} />
      <p className="mt-3 text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs leading-5 text-zinc-500">{body}</p>
    </button>
  );
}
