'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { buildJobApplicationMessage } from '@/lib/jobLeadMessage';
import { formatMerchantName } from '@/lib/formatMerchantName';
import { businessHasPublicPhoto } from '@/lib/businessMapping';
import { assertBusinessSession } from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { revalidateHomePage } from '@/lib/homePageData';

export async function createJob(data: {
  title: string;
  type: string;
  location: string;
  salary?: string;
  description: string;
  department?: string;
  businessId: string;
}) {
  try {
    const auth = await assertBusinessSession(data.businessId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createClient(await cookies());

    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', data.businessId)
      .eq('status', 'active');

    if (countError) throw countError;

    if (count !== null && count >= 3) {
      return { success: false, error: 'Maximum limit of 3 active job postings reached.' };
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        title: data.title,
        type: data.type,
        location: data.location,
        salary: data.salary,
        description: data.description,
        department: data.department,
        business_id: data.businessId,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/dashboard');
    revalidatePath('/categories/job');
    revalidateHomePage();
    return { success: true, job };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create job';
    console.error('Create Job Error:', error);
    return { success: false, error: message };
  }
}

export async function getJobsByBusiness(businessId: string) {
  try {
    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const supabase = createClient(await cookies());

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, jobs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    console.error('Get Jobs Error:', error);
    return { success: false, error: message };
  }
}

export async function deleteJob(jobId: string) {
  try {
    const supabase = createClient(await cookies());

    const { data: job, error: fetchError } = await supabase
      .from('jobs')
      .select('business_id')
      .eq('id', jobId)
      .single();

    if (fetchError || !job?.business_id) {
      return { success: false, error: 'Job not found' };
    }

    const auth = await assertBusinessSession(job.business_id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const { error } = await supabase.from('jobs').delete().eq('id', jobId);

    if (error) throw error;

    revalidatePath('/business/dashboard');
    revalidatePath('/categories/job');
    revalidateHomePage();
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete job';
    console.error('Delete Job Error:', error);
    return { success: false, error: message };
  }
}

export async function updateJob(jobId: string, data: {
  title?: string;
  type?: string;
  location?: string;
  salary?: string;
  description?: string;
  department?: string;
  status?: string;
}) {
  try {
    const supabase = createClient(await cookies());

    const { data: existing, error: fetchError } = await supabase
      .from('jobs')
      .select('business_id')
      .eq('id', jobId)
      .single();

    if (fetchError || !existing?.business_id) {
      return { success: false, error: 'Job not found' };
    }

    const auth = await assertBusinessSession(existing.business_id);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }

    const { data: job, error } = await supabase
      .from('jobs')
      .update(data)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;

    revalidatePath('/business/dashboard');
    revalidatePath('/categories/job');
    revalidateHomePage();
    return { success: true, job };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update job';
    console.error('Update Job Error:', error);
    return { success: false, error: message };
  }
}

export async function getAllJobs() {
  try {
    const supabase = createClient(await cookies());

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select(`
        *,
        business:business_id (
          id,
          slug,
          businessName,
          city,
          profilePictureUrl,
          images,
          isVerified,
          latitude,
          longitude
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const normalizedJobs = (jobs ?? [])
      .filter((job) => {
        if (!job.business || typeof job.business !== 'object') return false;
        return businessHasPublicPhoto(job.business as Record<string, unknown>);
      })
      .map((job) => {
        const business = job.business as { businessName?: string | null };
        return {
          ...job,
          business: {
            ...job.business,
            businessName: formatMerchantName(business.businessName) || business.businessName,
          },
        };
      });

    return { success: true, jobs: normalizedJobs };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    console.error('Get All Jobs Error:', error);
    return { success: false, error: message };
  }
}

/** Public: active job postings for a merchant profile. */
export async function getActiveJobsByBusiness(businessId: string) {
  try {
    const supabase = createClient(await cookies());

    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, business_id, title, type, location, salary, description, department, created_at, status')
      .eq('business_id', businessId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, jobs: jobs ?? [] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    console.error('Get Active Jobs By Business Error:', error);
    return { success: false, error: message, jobs: [] as never[] };
  }
}

export async function submitJobApplication(data: {
  jobId: string;
  businessId: string;
  jobTitle?: string;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', 'job-application');
    if (!writeLimit.ok) return { success: false, error: writeLimit.error };

    const supabase = createClient(await cookies());

    let jobTitle: string = data.jobTitle?.trim() || '';
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, title, business_id')
      .eq('id', data.jobId)
      .single();

    if (jobError || !job) {
      return { success: false, error: 'Job not found' };
    }

    if (job.business_id !== data.businessId) {
      return { success: false, error: 'Invalid job application' };
    }

    if (!jobTitle) {
      jobTitle = job.title?.trim() || 'Job posting';
    }

    const { error } = await supabase
      .from('leads')
      .insert({
        name: data.fullName,
        email: data.email,
        phone: data.phone,
        category: 'Job Application',
        business_id: data.businessId,
        message: buildJobApplicationMessage(jobTitle, data.message),
        status: 'New',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to submit application';
    console.error('Submit Application Error:', error);
    return { success: false, error: message };
  }
}
