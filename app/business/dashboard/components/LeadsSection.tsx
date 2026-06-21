'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  HiOutlineBriefcase,
  HiOutlineBuildingStorefront,
  HiOutlineCursorArrowRays,
  HiOutlineRocketLaunch,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineChevronRight,
  HiOutlineCheckCircle,
  HiOutlineSparkles,
} from 'react-icons/hi2';
import { FaWhatsapp } from 'react-icons/fa';
import {
  getBusinessLeads,
  updateLeadStatus,
  type BusinessLead,
} from '@/app/actions/leads';
import { leadBadgeClassName } from '@/lib/leadBadges';
import { formatRelativeTime, phoneDigits, whatsappLink } from '@/lib/formatRelativeTime';
import { parseJobLeadDisplay } from '@/lib/jobLeadMessage';
import { dashboard } from './dashboard-ui';
import { DashboardSectionHeader } from './DashboardShell';

type LeadsSectionProps = {
  businessId: string;
  isPaymentPending: boolean;
  variant: 'overview' | 'leads';
  onCountChange?: (count: number) => void;
};

type LeadTab = 'business' | 'jobs';

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function isJobLead(lead: BusinessLead) {
  return lead.category === 'Job Application';
}

function isNewLead(lead: BusinessLead) {
  return lead.status === 'New' || lead.status === 'New Lead';
}

function getLeadEnquiryDisplay(lead: BusinessLead) {
  if (isJobLead(lead)) {
    const { jobTitle, candidateMessage } = parseJobLeadDisplay(lead.message);
    if (jobTitle) {
      return {
        primary: jobTitle,
        secondary: candidateMessage && candidateMessage !== 'No message provided' ? candidateMessage : null,
      };
    }
  }

  return {
    primary: lead.message || lead.category,
    secondary: null as string | null,
  };
}

function maskName(name: string, locked: boolean) {
  return locked ? name.replace(/(?<=.)./g, '•') : name;
}

function LeadStatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'gold' | 'navy';
}) {
  return (
    <div
      className={`rounded-lg border px-4 py-3 ${
        accent === 'gold'
          ? 'border-[#f9b864]/40 bg-[#fff9ed]/80'
          : accent === 'navy'
            ? 'border-[#215481]/15 bg-[#215481]/[0.04]'
            : 'border-zinc-200 bg-white'
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold tabular-nums text-[#153551]">{value}</p>
    </div>
  );
}

export default function LeadsSection({
  businessId,
  isPaymentPending,
  variant,
  onCountChange,
}: LeadsSectionProps) {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeadTab>('business');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const res = await getBusinessLeads(businessId);
      if (cancelled) return;

      if (res.success) {
        setLeads(res.leads);
        onCountChange?.(res.leads.length);
      } else {
        setLeads([]);
        onCountChange?.(0);
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [businessId, onCountChange]);

  const businessLeads = useMemo(() => leads.filter((lead) => !isJobLead(lead)), [leads]);
  const jobLeads = useMemo(() => leads.filter(isJobLead), [leads]);
  const newBusinessCount = businessLeads.filter(isNewLead).length;
  const newJobCount = jobLeads.filter(isNewLead).length;
  const totalNew = newBusinessCount + newJobCount;

  useEffect(() => {
    if (activeTab === 'business' && businessLeads.length === 0 && jobLeads.length > 0) {
      setActiveTab('jobs');
    } else if (activeTab === 'jobs' && jobLeads.length === 0 && businessLeads.length > 0) {
      setActiveTab('business');
    }
  }, [activeTab, businessLeads.length, jobLeads.length]);

  const handleMarkContacted = async (leadId: string) => {
    setUpdatingId(leadId);
    const res = await updateLeadStatus(leadId, 'Contacted');
    if (res.success) {
      setLeads((prev) =>
        prev.map((lead) => (lead.id === leadId ? { ...lead, status: 'Contacted' } : lead))
      );
    }
    setUpdatingId(null);
  };

  const contactMessage = (lead: BusinessLead) => {
    if (isJobLead(lead)) {
      const { jobTitle, candidateMessage } = parseJobLeadDisplay(lead.message);
      if (jobTitle) {
        return `Hi ${lead.name}, thanks for applying for ${jobTitle} on FinderB${candidateMessage && candidateMessage !== 'No message provided' ? `. Message: ${candidateMessage}` : '.'}`;
      }
    }
    return `Hi ${lead.name}, thanks for your enquiry on FinderB${lead.message ? `: ${lead.message}` : '.'}`;
  };

  const renderContactActions = (lead: BusinessLead) => {
    const phone = lead.phone?.trim();
    const email = lead.email?.trim();
    const btnBase =
      'inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors';

    if (isPaymentPending) {
      return (
        <Link
          href={`/pricing?businessId=${businessId}`}
          className={`${btnBase} bg-[#f9b864] text-[#153551] hover:bg-[#ffcc70]`}
        >
          <HiOutlineRocketLaunch size={12} />
          Activate to unlock
        </Link>
      );
    }

    return (
      <div className="flex flex-wrap gap-1.5">
        {phone && (
          <>
            <a
              href={`tel:${phoneDigits(phone)}`}
              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-500`}
            >
              <HiOutlinePhone size={12} />
              Call
            </a>
            <a
              href={whatsappLink(phone, contactMessage(lead))}
              target="_blank"
              rel="noopener noreferrer"
              className={`${btnBase} bg-[#25D366] text-white hover:bg-[#1fb855]`}
            >
              <FaWhatsapp size={12} />
              WhatsApp
            </a>
          </>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Re: Your FinderB enquiry')}&body=${encodeURIComponent(contactMessage(lead))}`}
            className={`${btnBase} border border-zinc-200 bg-white text-zinc-700 hover:border-[#215481]/30 hover:text-[#215481]`}
          >
            <HiOutlineEnvelope size={12} />
            Email
          </a>
        )}
        {!phone && !email && <span className="text-[11px] text-zinc-400">No contact on file</span>}
      </div>
    );
  };

  const renderLeadCard = (lead: BusinessLead) => {
    const enquiry = getLeadEnquiryDisplay(lead);
    const isNew = isNewLead(lead);
    const isJob = isJobLead(lead);

    return (
      <article
        key={lead.id}
        className={`relative overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-sm ${
          isNew ? 'border-[#f9b864]/50 ring-1 ring-[#f9b864]/20' : 'border-zinc-200'
        }`}
      >
        {isNew && (
          <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-[#f9b864] to-[#f69e32]" aria-hidden />
        )}

        <div className="flex flex-col gap-4 p-4 pl-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-1 gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                isNew ? 'bg-[#f9b864] text-[#153551]' : 'bg-[#153551] text-white'
              }`}
            >
              {initials(lead.name)}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-bold text-zinc-900">
                  {maskName(lead.name, isPaymentPending)}
                </h4>
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${leadBadgeClassName(lead.status)}`}
                >
                  {lead.status}
                </span>
                {isJob && (
                  <span className="rounded-full bg-[#215481]/8 px-2 py-0.5 text-[10px] font-semibold text-[#215481]">
                    Job application
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-zinc-400">{formatRelativeTime(lead.created_at)}</p>

              <p className="mt-2 text-sm font-medium leading-snug text-zinc-800">{enquiry.primary}</p>
              {enquiry.secondary && (
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{enquiry.secondary}</p>
              )}

              {!isPaymentPending && (lead.phone || lead.email) && (
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-zinc-500">
                  {lead.phone && <span>{lead.phone}</span>}
                  {lead.email && <span className="break-all">{lead.email}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end sm:pl-4">
            {!isPaymentPending && isNew && (
              <button
                type="button"
                disabled={updatingId === lead.id}
                onClick={() => handleMarkContacted(lead.id)}
                className="inline-flex items-center justify-center gap-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-[11px] font-semibold text-[#215481] hover:bg-zinc-50 disabled:opacity-50"
              >
                <HiOutlineCheckCircle size={13} />
                {updatingId === lead.id ? 'Saving…' : 'Mark contacted'}
              </button>
            )}
            {renderContactActions(lead)}
          </div>
        </div>
      </article>
    );
  };

  const renderLeadList = (
    type: LeadTab,
    items: BusinessLead[],
    options?: { limit?: number; emptyTitle: string; emptyHint: string }
  ) => {
    const limit = options?.limit;
    const visible = limit ? items.slice(0, limit) : items;
    const isJob = type === 'jobs';
    const Icon = isJob ? HiOutlineBriefcase : HiOutlineBuildingStorefront;

    if (visible.length === 0) {
      return (
        <div className={`${dashboard.panel} ${dashboard.emptyState}`}>
          <Icon size={28} className="text-zinc-300" />
          <p className="mt-3 text-sm font-bold text-zinc-800">{options?.emptyTitle}</p>
          <p className="mt-1 max-w-sm text-xs text-zinc-500">{options?.emptyHint}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {limit && items.length > limit && (
          <p className="text-right text-[11px] text-zinc-400">Showing latest {limit} of {items.length}</p>
        )}
        {visible.map(renderLeadCard)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${dashboard.panel} ${dashboard.emptyState} py-16`}>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#215481] border-t-transparent" />
        <p className="mt-3 text-sm text-zinc-500">Loading your leads…</p>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div>
        {variant === 'overview' && (
          <DashboardSectionHeader
            title="Latest enquiries"
            description="Business and job leads appear here separately."
          />
        )}
        <div className={`${dashboard.panel} ${dashboard.emptyState} py-14`}>
          <HiOutlineCursorArrowRays size={36} className="text-[#f9b864]" />
          <h4 className="mt-4 text-base font-bold text-zinc-900">No leads yet</h4>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500">
            When customers enquire on your profile or apply to your jobs, they show up here with contact
            details ready to reach out.
          </p>
          <Link
            href={`/business/${businessId}`}
            target="_blank"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#215481] hover:underline"
          >
            View public profile <HiOutlineChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  if (isPaymentPending && variant === 'overview') {
    return (
      <div>
        <DashboardSectionHeader
          title="Latest enquiries"
          description="Activate Growth Pro to view contact details."
        />
        <div className={`${dashboard.panel} ${dashboard.emptyState} py-12`}>
          <p className="text-5xl font-bold text-[#153551]">{leads.length}</p>
          <p className="mt-2 text-sm text-zinc-600">people enquired — upgrade to see their phone and email</p>
          <Link href={`/pricing?businessId=${businessId}`} className={`mt-5 ${dashboard.btnPrimary}`}>
            <HiOutlineRocketLaunch size={16} />
            Activate Growth Pro
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {variant === 'leads' && (
        <>
          {isPaymentPending && (
            <div className="flex flex-col gap-3 rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-[#fff9ed] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <HiOutlineSparkles size={20} className="mt-0.5 shrink-0 text-[#f69e32]" />
                <div>
                  <p className="text-sm font-bold text-[#153551]">You have enquiries waiting</p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Activate Growth Pro to see names, phone numbers, and email for {leads.length} lead
                    {leads.length === 1 ? '' : 's'}.
                  </p>
                </div>
              </div>
              <Link
                href={`/pricing?businessId=${businessId}`}
                className={`shrink-0 ${dashboard.btnPrimary}`}
              >
                <HiOutlineRocketLaunch size={14} />
                Unlock leads
              </Link>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <LeadStatChip label="Total leads" value={leads.length} accent="navy" />
            <LeadStatChip label="New" value={totalNew} accent={totalNew > 0 ? 'gold' : undefined} />
            <LeadStatChip label="Business" value={businessLeads.length} />
            <LeadStatChip label="Job apps" value={jobLeads.length} />
          </div>

          <div className={dashboard.segmentGroup}>
            <button
              type="button"
              onClick={() => setActiveTab('business')}
              className={`${dashboard.segmentBtn} ${
                activeTab === 'business' ? dashboard.segmentActive : dashboard.segmentInactive
              }`}
            >
              <HiOutlineBuildingStorefront size={14} />
              Business enquiries
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  activeTab === 'business' ? 'bg-[#215481]/10 text-[#215481]' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {businessLeads.length}
                {newBusinessCount > 0 ? ` · ${newBusinessCount} new` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('jobs')}
              className={`${dashboard.segmentBtn} ${
                activeTab === 'jobs' ? dashboard.segmentActive : dashboard.segmentInactive
              }`}
            >
              <HiOutlineBriefcase size={14} />
              Job applications
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  activeTab === 'jobs' ? 'bg-[#215481]/10 text-[#215481]' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {jobLeads.length}
                {newJobCount > 0 ? ` · ${newJobCount} new` : ''}
              </span>
            </button>
          </div>
        </>
      )}

      {variant === 'overview' && (
        <DashboardSectionHeader
          title="Latest enquiries"
          description="Recent business and job leads — open Lead center for the full list."
        />
      )}

      {variant === 'overview' ? (
        <div className="space-y-6">
          {businessLeads.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Business enquiries
              </p>
              {renderLeadList('business', businessLeads, {
                limit: 3,
                emptyTitle: 'No business enquiries yet',
                emptyHint: 'Profile enquiries show up here.',
              })}
            </div>
          )}
          {jobLeads.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-zinc-500">
                Job applications
              </p>
              {renderLeadList('jobs', jobLeads, {
                limit: 2,
                emptyTitle: 'No job applications yet',
                emptyHint: 'Applications from your job postings show up here.',
              })}
            </div>
          )}
        </div>
      ) : activeTab === 'business' ? (
        renderLeadList('business', businessLeads, {
          emptyTitle: 'No business enquiries',
          emptyHint: 'When customers enquire on FinderB, they appear in this list.',
        })
      ) : (
        renderLeadList('jobs', jobLeads, {
          emptyTitle: 'No job applications',
          emptyHint: 'When candidates apply to your postings, they appear here.',
        })
      )}
    </div>
  );
}
