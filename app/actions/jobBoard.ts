'use server';

import { assertBusinessTab } from '@/lib/businessTeam/teamActor.server';
import {
  applicationDownload,
  listJobApplications,
  loadHrContact,
  saveHrContact,
  shortlistApplication,
} from '@/lib/jobBoard.server';

export async function getHrContact(businessId: string) {
  const auth = await assertBusinessTab(businessId, 'jobs', 'view');
  if (!auth.ok) return { success: false as const, error: auth.error };
  const hr = await loadHrContact(businessId);
  return { success: true as const, hr };
}

export async function updateHrContact(businessId: string, email: string, mobile: string) {
  const auth = await assertBusinessTab(businessId, 'jobs', 'edit');
  if (!auth.ok) return { success: false as const, error: auth.error };
  return saveHrContact(businessId, email, mobile);
}

export async function getJobApplications(businessId: string, jobId: string) {
  const auth = await assertBusinessTab(businessId, 'jobs', 'view');
  if (!auth.ok) return { success: false as const, error: auth.error, applications: [] };
  return listJobApplications(businessId, jobId);
}

export async function markApplicationShortlisted(businessId: string, applicationId: string) {
  const auth = await assertBusinessTab(businessId, 'jobs', 'edit');
  if (!auth.ok) return { success: false as const, error: auth.error };
  return shortlistApplication(businessId, applicationId);
}

export async function getApplicationFile(businessId: string, applicationId: string) {
  const auth = await assertBusinessTab(businessId, 'jobs', 'view');
  if (!auth.ok) return { success: false as const, error: auth.error };
  return applicationDownload(businessId, applicationId);
}
