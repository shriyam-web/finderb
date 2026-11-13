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
  markLeadRead,
  updateLeadStatus,
  type BusinessLead,
} from '@/app/actions/leads';
import { isLeadUnread } from '@/lib/leadRead';
import LeadSourceBadge from '@/components/leads/LeadSourceBadge';
import {
  LEAD_PIPELINE_STATUSES,
  LEAD_STATUS_CONTACTED,
  isDirectLeadSource,
  isOpenLead,
  leadPipelineClassName,
  leadPipelineOf,
  leadSourceOf,
} from '@/lib/leadBadges';
import { formatRelativeTime, phoneDigits, whatsappLink } from '@/lib/formatRelativeTime';
import { parseJobLeadDisplay } from '@/lib/jobLeadMessage';
import { getPaidPlansLabel } from '@/lib/subscription/merchantSubscription';
import { dashboard } from './dashboard-ui';
import { DashboardSectionHeader } from './DashboardShell';

type LeadsSectionProps = {
  businessId: string;
  businessProfilePath?: string;
  isPaymentPending: boolean;
  variant: 'overview' | 'leads';
  onCountChange?: (count: number) => void;
  onUnreadChange?: (count: number) => void;
  canEdit?: boolean;
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

function isDirectLead(lead: BusinessLead) {
  return isDirectLeadSource(lead);
}

function isNewLead(lead: BusinessLead) {
  return isLeadUnread(lead);
}

function getLeadEnquiryDisplay(lead: BusinessLead) {
  if (isDirectLead(lead)) {
    return {
      primary: lead.message || 'Direct contact from profile',
      secondary: 'Customer signed in and clicked contact on your listing',
    };
  }

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

function LeadIdCopy({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(id).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
      className="shrink-0 rounded-md border border-zinc-300 bg-zinc-50 px-1.5 py-1 text-[10px] font-semibold leading-none text-zinc-700 hover:bg-zinc-100"
      title="Copy lead id"
    >
      {copied ? 'Copied' : 'Lead ID'}
    </button>
  );
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
      className={`rounded-md border px-2.5 py-1.5 ${
        accent === 'gold'
          ? 'border-[#f9b864]/40 bg-[#fff9ed]/80'
          : accent === 'navy'
            ? 'border-[#3F3F46]/15 bg-[#3F3F46]/[0.04]'
            : 'border-zinc-200 bg-white'
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">{label}</p>
      <p className="text-base font-bold tabular-nums leading-tight text-[#27272A]">{value}</p>
    </div>
  );
}

export default function LeadsSection({
  businessId,
  businessProfilePath,
  isPaymentPending,
  variant,
  onCountChange,
  onUnreadChange,
  canEdit = true,
}: LeadsSectionProps) {
  const [leads, setLeads] = useState<BusinessLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LeadTab>('business');
  const [shown, setShown] = useState(50);

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
  const directLeadCount = useMemo(
    () => businessLeads.filter(isDirectLead).length,
    [businessLeads],
  );
  const overviewBusinessLimit = 3;
  const overviewJobLimit = 2;
  const hasMoreOverviewLeads =
    businessLeads.length > overviewBusinessLimit || jobLeads.length > overviewJobLimit;
  const newBusinessCount = businessLeads.filter(isNewLead).length;
  const newJobCount = jobLeads.filter(isNewLead).length;
  const totalNew = newBusinessCount + newJobCount;

  useEffect(() => {
    onUnreadChange?.(totalNew);
  }, [totalNew, onUnreadChange]);

  const markRead = (leadId: string) => {
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId && !lead.merchant_read_at
          ? { ...lead, merchant_read_at: new Date().toISOString() }
          : lead,
      ),
    );
    void markLeadRead(leadId);
  };

  const handleSetStatus = async (leadId: string, status: string) => {
    setUpdatingId(leadId);
    const res = await updateLeadStatus(leadId, status);
    if (res.success) {
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId
            ? { ...lead, status, merchant_read_at: lead.merchant_read_at || new Date().toISOString() }
            : lead,
        ),
      );
    }
    setUpdatingId(null);
  };

  const handleMarkContacted = async (leadId: string) => {
    await handleSetStatus(leadId, LEAD_STATUS_CONTACTED);
  };

  const contactMessage = (lead: BusinessLead) => {
    if (isDirectLead(lead)) {
      return `Hi ${lead.name}, thanks for reaching out via our FinderB listing.`;
    }

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
          className={`${btnBase} bg-[#f9b864] text-[#27272A] hover:bg-[#ffcc70]`}
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
              onClick={() => markRead(lead.id)}
              className={`${btnBase} bg-emerald-600 text-white hover:bg-emerald-500`}
            >
              <HiOutlinePhone size={12} />
              Call
            </a>
            <a
              href={whatsappLink(phone, contactMessage(lead))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => markRead(lead.id)}
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
            onClick={() => markRead(lead.id)}
            className={`${btnBase} border border-zinc-200 bg-white text-zinc-700 hover:border-[#3F3F46]/30 hover:text-[#3F3F46]`}
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
        className={`rounded-xl border bg-white px-3 py-2.5 ${
          isNew ? 'border-[#f9b864]/60' : 'border-zinc-200/90'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
              isNew ? 'bg-[#f9b864] text-[#27272A]' : 'bg-zinc-100 text-zinc-700'
            }`}
          >
            {initials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="min-w-0 flex-1 truncate text-[13px] font-semibold text-zinc-900">
                    {maskName(lead.name, isPaymentPending)}
                  </h4>
                  <span className="shrink-0 text-[11px] text-zinc-400">{formatRelativeTime(lead.created_at)}</span>
                </div>
              </div>
              <LeadIdCopy id={lead.id} />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <LeadSourceBadge source={leadSourceOf(lead)} />
              <span
                className={`inline-flex rounded-full border px-1.5 py-px text-[10px] font-semibold ${leadPipelineClassName(lead.status)}`}
              >
                {leadPipelineOf(lead)}
              </span>
              {isJob ? (
                <span className="text-[10px] font-medium text-[#3F3F46]">Job</span>
              ) : null}
              <span className="min-w-0 truncate text-[12px] text-zinc-600">{enquiry.primary}</span>
            </div>
            {enquiry.secondary ? (
              <p className="mt-0.5 whitespace-pre-wrap text-[12px] text-zinc-500">{enquiry.secondary}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-end gap-1.5">
          {!isPaymentPending && canEdit ? (
            <label className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
              Status
              <select
                value={leadPipelineOf(lead)}
                disabled={updatingId === lead.id}
                onChange={(event) => void handleSetStatus(lead.id, event.target.value)}
                className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-[#3F3F46] outline-none"
              >
                {LEAD_PIPELINE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {!isPaymentPending && canEdit && isNew ? (
            <button
              type="button"
              disabled={updatingId === lead.id}
              onClick={() => handleMarkContacted(lead.id)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 text-[11px] font-semibold text-[#3F3F46] hover:bg-zinc-50 disabled:opacity-50"
            >
              <HiOutlineCheckCircle size={12} />
              {updatingId === lead.id ? 'Saving…' : 'Contacted'}
            </button>
          ) : null}
          {renderContactActions(lead)}
        </div>
      </article>
    );
  };

  const renderLeadList = (
    type: LeadTab,
    items: BusinessLead[],
    options?: { limit?: number; emptyTitle: string; emptyHint: string; onLoadMore?: () => void }
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
      <div className="space-y-2">
        {limit && items.length > limit && !options?.onLoadMore ? (
          <p className="text-right text-[11px] text-zinc-400">Showing latest {limit} of {items.length}</p>
        ) : null}
        {visible.map(renderLeadCard)}
        {options?.onLoadMore && limit && items.length > limit ? (
          <button
            type="button"
            onClick={options.onLoadMore}
            className="text-sm font-medium text-zinc-700 hover:underline"
          >
            Load more ({items.length - limit} left)
          </button>
        ) : null}
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`${dashboard.panel} ${dashboard.emptyState} py-16`}>
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#3F3F46] border-t-transparent" />
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
            When customers enquire on your profile, click Call or WhatsApp, or apply to your jobs, they show up here with contact
            details ready to reach out.
          </p>
          <Link
            href={businessProfilePath ?? '#'}
            target="_blank"
            className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#3F3F46] hover:underline"
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
          description={`Upgrade to ${getPaidPlansLabel()} to view contact details.`}
        />
        <div className={`${dashboard.panel} ${dashboard.emptyState} py-12`}>
          <p className="text-5xl font-bold text-[#27272A]">{leads.length}</p>
          <p className="mt-2 text-sm text-zinc-600">people enquired — upgrade to see their phone and email</p>
          <Link href={`/pricing?businessId=${businessId}`} className={`mt-5 ${dashboard.btnPrimary}`}>
            <HiOutlineRocketLaunch size={16} />
            Choose plan
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
                  <p className="text-sm font-bold text-[#27272A]">You have enquiries waiting</p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    Upgrade to {getPaidPlansLabel()} to see names, phone numbers, and email for {leads.length} lead
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <LeadStatChip label="Total leads" value={leads.length} accent="navy" />
            <LeadStatChip label="To contact" value={totalNew} accent={totalNew > 0 ? 'gold' : undefined} />
            <LeadStatChip label="Direct" value={directLeadCount} />
            <LeadStatChip label="Job apps" value={jobLeads.length} />
          </div>

          <div className={dashboard.segmentGroup}>
            <button
              type="button"
              onClick={() => {
                setActiveTab('business');
                setShown(50);
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'business' ? dashboard.segmentActive : dashboard.segmentInactive
              }`}
            >
              <HiOutlineBuildingStorefront size={12} />
              Customers
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  activeTab === 'business' ? 'bg-[#3F3F46]/10 text-[#3F3F46]' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {businessLeads.length}
                {newBusinessCount > 0 ? ` · ${newBusinessCount} open` : ''}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('jobs');
                setShown(50);
              }}
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                activeTab === 'jobs' ? dashboard.segmentActive : dashboard.segmentInactive
              }`}
            >
              <HiOutlineBriefcase size={12} />
              Job applications
              <span
                className={`rounded-full px-1.5 py-px text-[10px] ${
                  activeTab === 'jobs' ? 'bg-[#3F3F46]/10 text-[#3F3F46]' : 'bg-zinc-200/80 text-zinc-600'
                }`}
              >
                {jobLeads.length}
                {newJobCount > 0 ? ` · ${newJobCount} open` : ''}
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
                limit: overviewBusinessLimit,
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
                limit: overviewJobLimit,
                emptyTitle: 'No job applications yet',
                emptyHint: 'Applications from your job postings show up here.',
              })}
            </div>
          )}
          {hasMoreOverviewLeads && (
            <div className="flex justify-end">
              <Link
                href="/business/dashboard?tab=leads"
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#3F3F46] hover:underline"
              >
                View all leads
                <HiOutlineChevronRight size={16} />
              </Link>
            </div>
          )}
        </div>
      ) : activeTab === 'business' ? (
        renderLeadList('business', businessLeads, {
          limit: shown,
          onLoadMore: () => setShown((count) => count + 50),
          emptyTitle: 'No business enquiries',
          emptyHint: 'When customers enquire on FinderB, they appear in this list.',
        })
      ) : (
        renderLeadList('jobs', jobLeads, {
          limit: shown,
          onLoadMore: () => setShown((count) => count + 50),
          emptyTitle: 'No job applications',
          emptyHint: 'When candidates apply to your postings, they appear here.',
        })
      )}
    </div>
  );
}
