'use server';

import { prisma } from '@/lib/prisma';
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
    // Check if business already has 3 active jobs
    const activeJobsCount = await prisma.job.count({
      where: {
        businessId: data.businessId,
        status: 'active'
      }
    });

    if (activeJobsCount >= 3) {
      return { success: false, error: 'Maximum limit of 3 active job postings reached.' };
    }

    const job = await prisma.job.create({
      data: {
        title: data.title,
        type: data.type,
        location: data.location,
        salary: data.salary,
        description: data.description,
        department: data.department,
        businessId: data.businessId,
        status: 'active',
      },
    });

    revalidatePath('/business/dashboard');
    return { success: true, job };
  } catch (error: any) {
    console.error('Create Job Error:', error);
    return { success: false, error: error.message || 'Failed to create job' };
  }
}

export async function getJobsByBusiness(businessId: string) {
  try {
    const jobs = await prisma.job.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, jobs };
  } catch (error: any) {
    console.error('Get Jobs Error:', error);
    return { success: false, error: error.message || 'Failed to fetch jobs' };
  }
}

export async function deleteJob(jobId: string) {
  try {
    await prisma.job.delete({
      where: { id: jobId },
    });
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
    const job = await prisma.job.update({
      where: { id: jobId },
      data,
    });
    revalidatePath('/business/dashboard');
    return { success: true, job };
  } catch (error: any) {
    console.error('Update Job Error:', error);
    return { success: false, error: error.message || 'Failed to update job' };
  }
}
