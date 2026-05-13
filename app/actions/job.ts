'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

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
    const supabase = createClient(await cookies());
    
    console.log('📝 Creating job for business:', data.businessId);
    
    // Check if business already has 3 active jobs
    console.log('🔍 Checking active jobs count...');
    const { count, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('business_id', data.businessId)
      .eq('status', 'active');

    if (countError) throw countError;
    
    console.log('📊 Active jobs count:', count);

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
    return { success: true, job };
  } catch (error: any) {
    console.error('Create Job Error:', error);
    return { success: false, error: error.message || 'Failed to create job' };
  }
}

export async function getJobsByBusiness(businessId: string) {
  try {
    const supabase = createClient(await cookies());
    
    console.log('Fetching jobs for businessId:', businessId);
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    console.log('Fetched jobs count:', jobs?.length);
    return { success: true, jobs };
  } catch (error: any) {
    console.error('Get Jobs Error:', error);
    return { success: false, error: error.message || 'Failed to fetch jobs' };
  }
}

export async function deleteJob(jobId: string) {
  try {
    const supabase = createClient(await cookies());
    
    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', jobId);

    if (error) throw error;
    
    revalidatePath('/business/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error('Delete Job Error:', error);
    return { success: false, error: error.message || 'Failed to delete job' };
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
    
    const { data: job, error } = await supabase
      .from('jobs')
      .update(data)
      .eq('id', jobId)
      .select()
      .single();

    if (error) throw error;
    
    revalidatePath('/business/dashboard');
    return { success: true, job };
  } catch (error: any) {
    console.error('Update Job Error:', error);
    return { success: false, error: error.message || 'Failed to update job' };
  }
}
