import { isSupabaseConfigured, supabase } from './supabase';
import { createSessionMemo } from './sessionMemo';

export type JobListing = {
  id: string;
  title: string;
  type: string | null;
  location: string | null;
  salary: string | null;
  description: string | null;
  department: string | null;
  created_at: string | null;
  business: {
    id: string;
    slug: string | null;
    businessName: string | null;
    city: string | null;
    profilePictureUrl: string | null;
  } | null;
};

const jobsMemo = createSessionMemo<{
  jobs: JobListing[];
  error?: string;
}>();
const ACTIVE_JOBS_KEY = 'active';
const jobsById = new Map<string, JobListing>();

function rememberJobs(jobs: JobListing[]) {
  for (const job of jobs) jobsById.set(job.id, job);
}

/** A job already loaded by a list, so its detail screen can render without waiting on the network. */
export function peekJob(id: string): JobListing | null {
  return jobsById.get(id) ?? null;
}

export function peekActiveJobs(): {
  jobs: JobListing[];
  error?: string;
} | null {
  return jobsMemo.peek(ACTIVE_JOBS_KEY) ?? null;
}

export async function fetchActiveJobs(force = false): Promise<{
  jobs: JobListing[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { jobs: [], error: 'Supabase is not configured' };
  }

  const client = supabase;
  const result = await jobsMemo.get(
    ACTIVE_JOBS_KEY,
    async () => {
      const { data, error } = await client
        .from('jobs')
        .select(
          `
      id,
      title,
      type,
      location,
      salary,
      description,
      department,
      created_at,
      business:business_id (
        id,
        slug,
        businessName,
        city,
        profilePictureUrl
      )
    `,
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60);

      if (error) {
        return { jobs: [], error: error.message };
      }

      const jobs = (data ?? []).map((row) => {
        const businessRaw = row.business as
          | JobListing['business']
          | JobListing['business'][]
          | null;
        const business = Array.isArray(businessRaw)
          ? businessRaw[0] ?? null
          : businessRaw;
        return {
          id: String(row.id),
          title: String(row.title || 'Job opening'),
          type: (row.type as string | null) ?? null,
          location: (row.location as string | null) ?? null,
          salary: (row.salary as string | null) ?? null,
          description: (row.description as string | null) ?? null,
          department: (row.department as string | null) ?? null,
          created_at: (row.created_at as string | null) ?? null,
          business,
        } satisfies JobListing;
      });

      return { jobs };
    },
    force,
  );

  if (result.error) jobsMemo.delete(ACTIVE_JOBS_KEY);
  rememberJobs(result.jobs);
  return result;
}

export async function fetchJobsByBusinessId(businessId: string): Promise<{
  jobs: JobListing[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { jobs: [], error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      type,
      location,
      salary,
      description,
      department,
      created_at,
      business:business_id (
        id,
        slug,
        businessName,
        city,
        profilePictureUrl
      )
    `,
    )
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return { jobs: [], error: error.message };
  }

  const jobs = (data ?? []).map((row) => {
    const businessRaw = row.business as JobListing['business'] | JobListing['business'][] | null;
    const business = Array.isArray(businessRaw) ? businessRaw[0] ?? null : businessRaw;
    return {
      id: String(row.id),
      title: String(row.title || 'Job opening'),
      type: (row.type as string | null) ?? null,
      location: (row.location as string | null) ?? null,
      salary: (row.salary as string | null) ?? null,
      description: (row.description as string | null) ?? null,
      department: (row.department as string | null) ?? null,
      created_at: (row.created_at as string | null) ?? null,
      business,
    } satisfies JobListing;
  });

  rememberJobs(jobs);
  return { jobs };
}

export async function fetchJobById(id: string): Promise<{
  job: JobListing | null;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { job: null, error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase
    .from('jobs')
    .select(
      `
      id,
      title,
      type,
      location,
      salary,
      description,
      department,
      created_at,
      business:business_id (
        id,
        slug,
        businessName,
        city,
        profilePictureUrl
      )
    `,
    )
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) {
    return { job: null, error: error.message };
  }
  if (!data) {
    jobsById.delete(id);
    return { job: null, error: 'Job not found' };
  }

  const businessRaw = data.business as JobListing['business'] | JobListing['business'][] | null;
  const business = Array.isArray(businessRaw) ? businessRaw[0] ?? null : businessRaw;
  const job: JobListing = {
    id: String(data.id),
    title: String(data.title || 'Job opening'),
    type: (data.type as string | null) ?? null,
    location: (data.location as string | null) ?? null,
    salary: (data.salary as string | null) ?? null,
    description: (data.description as string | null) ?? null,
    department: (data.department as string | null) ?? null,
    created_at: (data.created_at as string | null) ?? null,
    business,
  };
  jobsById.set(job.id, job);

  return { job };
}

function buildJobApplicationMessage(jobTitle: string, candidateMessage?: string) {
  const msg = candidateMessage?.trim() || 'No message provided';
  return `Applied for: ${jobTitle}\n\nCandidate message: ${msg}`;
}

/** Public apply — creates a merchant lead (same as website job form). */
export async function submitJobApplication(input: {
  jobId: string;
  businessId: string;
  jobTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
}): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const fullName = input.fullName.trim();
  const email = input.email.trim();
  const phone = input.phone.trim();

  if (!fullName || !email || !phone) {
    return { success: false, error: 'Name, email, and phone are required' };
  }

  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select('id, title, business_id, status')
    .eq('id', input.jobId)
    .maybeSingle();

  if (jobError || !job) {
    return { success: false, error: 'Job not found' };
  }

  if (job.business_id !== input.businessId) {
    return { success: false, error: 'Invalid job application' };
  }

  if (job.status && job.status !== 'active') {
    return { success: false, error: 'This role is no longer open' };
  }

  const jobTitle =
    input.jobTitle?.trim() ||
    (typeof job.title === 'string' ? job.title.trim() : '') ||
    'Job posting';

  const now = new Date().toISOString();
  const { error } = await supabase.from('leads').insert({
    name: fullName,
    email,
    phone,
    category: 'Job Application',
    business_id: input.businessId,
    message: buildJobApplicationMessage(jobTitle, input.message),
    status: 'New',
    created_at: now,
    updated_at: now,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export function formatJobPosted(iso: string | null | undefined): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 0) return '';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function formatJobType(type: string | null | undefined): string {
  const raw = (type || '').trim();
  if (!raw) return 'Opening';
  return raw
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export const JOB_TYPE_FILTERS = [
  'All',
  'Full-time',
  'Part-time',
  'Contract',
  'Internship',
  'Freelance',
] as const;
