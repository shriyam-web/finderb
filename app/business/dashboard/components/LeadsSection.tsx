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
      'inline-flex items-center justify-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors';

    if (isPaymentPending) {
      return (
        <Link
          href={`/business/payment/${businessId}`}
          className={`${btnBase} bg-secondary-400 text-primary-900 hover:bg-secondary-300`}
        >
          <HiOutlineRocketLaunch size={12} />
          Activate
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
              Chat
            </a>
          </>
        )}
        {email && (
          <a
            href={`mailto:${email}?subject=${encodeURIComponent('Re: Your FinderB enquiry')}&body=${encodeURIComponent(contactMessage(lead))}`}
            className={`${btnBase} border border-slate-200 bg-white text-slate-700 hover:border-primary-200 hover:text-primary-700`}
          >
            <HiOutlineEnvelope size={12} />
            Email
          </a>
        )}
        {!phone && !email && <span className="text-[11px] text-slate-400">No contact</span>}
      </div>
    );
  };

  const renderLeadRow = (lead: BusinessLead) => {
    const enquiry = getLeadEnquiryDisplay(lead);

    return (
      <div
        key={lead.id}
        className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2.5 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-4"
      >
        <div className="flex min-w-0 flex-1 items-start gap-2.5">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${
              isNewLead(lead)
                ? 'bg-secondary-400 text-primary-900'
                : 'bg-primary-600 text-white'
            }`}
          >
            {initials(lead.name)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <p className="truncate text-sm font-semibold text-slate-900">
                {maskName(lead.name, isPaymentPending)}
              </p>
              <span className="text-[11px] text-slate-400">{formatRelativeTime(lead.created_at)}</span>
            </div>
            <p className="truncate text-sm text-slate-700">{enquiry.primary}</p>
            {enquiry.secondary && (
              <p className="truncate text-xs text-slate-500">{enquiry.secondary}</p>
            )}
            {!isPaymentPending && lead.phone && (
              <p className="text-[11px] text-slate-400">{lead.phone}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          <span
            className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${leadBadgeClassName(lead.status)}`}
          >
            {lead.status}
          </span>
          {!isPaymentPending && isNewLead(lead) && (
            <button
              type="button"
              disabled={updatingId === lead.id}
              onClick={() => handleMarkContacted(lead.id)}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary-600 hover:text-primary-800 disabled:opacity-50"
            >
              <HiOutlineCheckCircle size={12} />
              {updatingId === lead.id ? 'Saving…' : 'Contacted'}
            </button>
          )}
          {renderContactActions(lead)}
        </div>
      </div>
    );
  };

  const renderLeadBlock = (
    type: LeadTab,
    items: BusinessLead[],
    options?: { limit?: number; emptyTitle: string; emptyHint: string }
  ) => {
    const limit = options?.limit;
    const visible = limit ? items.slice(0, limit) : items;
    const isJob = type === 'jobs';
    const Icon = isJob ? HiOutlineBriefcase : HiOutlineBuildingStorefront;
    const label = isJob ? 'Job applications' : 'Business enquiries';
    const newCount = isJob ? newJobCount : newBusinessCount;

    if (visible.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-6 text-center">
          <Icon size={22} className="mx-auto text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-800">{options?.emptyTitle}</p>
          <p className="mt-1 text-xs text-slate-500">{options?.emptyHint}</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200/90 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <Icon size={15} className="text-primary-600" />
            <p className="text-sm font-semibold text-slate-900">{label}</p>
            <span className="rounded-full bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
              {items.length}
            </span>
            {newCount > 0 && (
              <span className="rounded-full bg-secondary-400 px-1.5 py-0.5 text-[10px] font-semibold text-primary-900">
                {newCount} new
              </span>
            )}
          </div>
          {limit && items.length > limit && (
            <span className="text-[11px] text-slate-400">Latest {limit}</span>
          )}
        </div>
        <div>{visible.map(renderLeadRow)}</div>
      </div>
    );
  };

  const title = variant === 'overview' ? 'Recent leads' : 'Lead center';

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-slate-200/90 bg-white py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="text-sm text-slate-500">Loading leads…</p>
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">Business and job leads appear here separately.</p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-8 text-center">
          <HiOutlineCursorArrowRays size={28} className="mx-auto text-primary-400" />
          <h4 className="mt-3 text-sm font-semibold text-slate-900">No leads yet</h4>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Customer enquiries and job applications will show up here when people reach out.
          </p>
          <Link
            href={`/business/${businessId}`}
            target="_blank"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-800"
          >
            View public profile <HiOutlineChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  if (isPaymentPending && variant === 'overview') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {businessLeads.length} business · {jobLeads.length} job — activate to view details
          </p>
        </div>
        <div className="rounded-xl border border-slate-200/90 bg-white px-4 py-6 text-center">
          <p className="text-2xl font-semibold text-primary-600">{leads.length}</p>
          <p className="mt-1 text-sm text-slate-600">leads waiting for you</p>
          <Link
            href={`/business/payment/${businessId}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-800"
          >
            <HiOutlineRocketLaunch size={16} />
            Activate leads
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {businessLeads.length} business · {jobLeads.length} job
            {(newBusinessCount + newJobCount) > 0 && ` · ${newBusinessCount + newJobCount} new`}
          </p>
        </div>
        {variant === 'leads' && isPaymentPending && (
          <Link
            href={`/business/payment/${businessId}`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-secondary-300 bg-secondary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 hover:bg-secondary-100"
          >
            <HiOutlineRocketLaunch size={14} />
            Unlock contacts
          </Link>
        )}
      </div>

      {variant === 'leads' && (
        <div className="flex gap-1 rounded-lg border border-slate-200/90 bg-slate-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('business')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'business'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HiOutlineBuildingStorefront size={14} />
            Business
            <span className="rounded-full bg-slate-200/80 px-1.5 py-px text-[10px]">{businessLeads.length}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('jobs')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'jobs'
                ? 'bg-white text-primary-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <HiOutlineBriefcase size={14} />
            Jobs
            <span className="rounded-full bg-slate-200/80 px-1.5 py-px text-[10px]">{jobLeads.length}</span>
          </button>
        </div>
      )}

      {variant === 'overview' ? (
        <div className="space-y-3">
          {renderLeadBlock('business', businessLeads, {
            limit: 3,
            emptyTitle: 'No business enquiries yet',
            emptyHint: 'Profile and category enquiries show up here.',
          })}
          {renderLeadBlock('jobs', jobLeads, {
            limit: 2,
            emptyTitle: 'No job applications yet',
            emptyHint: 'Applications from your job postings show up here.',
          })}
        </div>
      ) : activeTab === 'business' ? (
        renderLeadBlock('business', businessLeads, {
          emptyTitle: 'No business enquiries',
          emptyHint: 'When customers enquire on FinderB, they appear in this list.',
        })
      ) : (
        renderLeadBlock('jobs', jobLeads, {
          emptyTitle: 'No job applications',
          emptyHint: 'When candidates apply to your postings, they appear here.',
        })
      )}
    </div>
  );
}
