import 'server-only';

import { randomUUID } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { inspectCv, type CvKind } from '@/lib/cvFile';
import { sendOwnershipEmail } from '@/lib/email/sendOwnershipEmail';
import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import { queueBusinessPush, recordDirectUserNotification } from '@/lib/userNotifications.server';
import { pickPublicBusinessEmail } from '@/lib/placeholderEmail';

const BUCKET = 'job-cvs';

export type HrContact = { email: string; mobile: string };

function digits(value: string) {
  return value.replace(/\D/g, '');
}

export function hrMobileError(raw: string): string | null {
  const mobile = digits(raw);
  const local = mobile.length > 10 ? mobile.slice(-10) : mobile;
  if (!/^[6-9]\d{9}$/.test(local)) return 'Enter a valid 10-digit HR mobile number.';
  return null;
}

export function hrEmailError(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid HR email.';
  return null;
}

export async function loadHrContact(businessId: string): Promise<HrContact> {
  const supabase = createServiceClient();
  if (!supabase) return { email: '', mobile: '' };
  const { data, error } = await supabase
    .from('Business')
    .select('hr_email, hr_mobile')
    .eq('id', businessId)
    .maybeSingle();
  if (error) return { email: '', mobile: '' };
  return {
    email: String(data?.hr_email || '').trim(),
    mobile: String(data?.hr_mobile || '').trim(),
  };
}

export async function saveHrContact(businessId: string, emailRaw: string, mobileRaw: string) {
  const emailError = hrEmailError(emailRaw);
  if (emailError) return { success: false as const, error: emailError };
  const mobileError = hrMobileError(mobileRaw);
  if (mobileError) return { success: false as const, error: mobileError };
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'HR contact could not be saved.' };
  const email = emailRaw.trim().toLowerCase();
  const mobile = digits(mobileRaw).slice(-10);
  const { error } = await supabase
    .from('Business')
    .update({ hr_email: email, hr_mobile: mobile })
    .eq('id', businessId);
  if (error) {
    return {
      success: false as const,
      error: 'HR contact could not be saved. Run supabase/job_hiring.sql if this is the first time.',
    };
  }
  return { success: true as const, hr: { email, mobile } };
}

export async function requireHrContact(businessId: string) {
  const hr = await loadHrContact(businessId);
  if (!hr.email || !hr.mobile) {
    return {
      ok: false as const,
      error: 'Set your HR email and mobile number before posting a job.',
    };
  }
  return { ok: true as const, hr };
}

async function storeCv(businessId: string, file: { bytes: Buffer; kind: CvKind; contentType: string }) {
  const supabase = createServiceClient();
  if (!supabase) return { ok: false as const, error: 'CV storage is not available.' };
  const path = `${businessId}/${randomUUID()}.${file.kind}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file.bytes, {
    contentType: file.contentType,
    upsert: false,
  });
  if (error) {
    return {
      ok: false as const,
      error: 'CV could not be stored. Run supabase/job_hiring.sql to create the job-cvs bucket.',
    };
  }
  return { ok: true as const, path };
}

export async function recordJobApplication(input: {
  jobId: string;
  businessId: string;
  userId?: string | null;
  fullName: string;
  email: string;
  phone: string;
  message?: string;
  cv?: { filename: string; bytes: Buffer } | null;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Applications are not available right now.' };

  let cvPath = '';
  let cvName = '';
  let cvKind = '';
  if (input.cv) {
    const inspected = inspectCv(input.cv.filename, input.cv.bytes);
    if (!inspected.ok) return { success: false as const, error: inspected.error };
    const stored = await storeCv(input.businessId, inspected.file);
    if (!stored.ok) return { success: false as const, error: stored.error };
    cvPath = stored.path;
    cvName = inspected.file.safeName;
    cvKind = inspected.file.kind;
  }

  const { error } = await supabase.from('job_applications').insert({
    job_id: input.jobId,
    business_id: input.businessId,
    user_id: input.userId || null,
    full_name: input.fullName.slice(0, 120),
    email: input.email.slice(0, 200),
    phone: input.phone.slice(0, 20),
    message: input.message ? input.message.slice(0, 2000) : null,
    cv_path: cvPath || null,
    cv_name: cvName || null,
    cv_kind: cvKind || null,
    status: 'received',
  });
  if (error) {
    return {
      success: false as const,
      error: 'Application could not be saved. Run supabase/job_hiring.sql if this is the first time.',
    };
  }
  return { success: true as const };
}

export type JobApplicationRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  message: string | null;
  cv_name: string | null;
  cv_kind: string | null;
  status: string;
  created_at: string;
};

export async function listJobApplications(businessId: string, jobId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not load applications.' };
  const { data, error } = await supabase
    .from('job_applications')
    .select('id, full_name, email, phone, message, cv_name, cv_kind, status, created_at')
    .eq('business_id', businessId)
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });
  if (error) return { success: false as const, error: 'Could not load applications.' };
  const viewed = await supabase
    .from('job_applications')
    .update({ merchant_viewed_at: new Date().toISOString() })
    .eq('business_id', businessId)
    .eq('job_id', jobId)
    .is('merchant_viewed_at', null);
  if (viewed.error && !/column|schema cache|does not exist/i.test(viewed.error.message || '')) {
    console.error('[job applications viewed]', viewed.error);
  }
  return { success: true as const, applications: (data || []) as JobApplicationRow[] };
}

export async function unseenApplicationCounts(businessId: string) {
  const counts = new Map<string, number>();
  const supabase = createServiceClient();
  if (!supabase || !businessId.trim()) return counts;
  const { data, error } = await supabase
    .from('job_applications')
    .select('job_id')
    .eq('business_id', businessId)
    .is('merchant_viewed_at', null);
  if (error) return counts;
  for (const row of data || []) {
    const id = String(row.job_id || '');
    if (!id) continue;
    counts.set(id, (counts.get(id) || 0) + 1);
  }
  return counts;
}

export async function applicationDownload(businessId: string, applicationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not open this CV.' };
  const { data, error } = await supabase
    .from('job_applications')
    .select('cv_path, cv_name, cv_kind, business_id')
    .eq('id', applicationId)
    .maybeSingle();
  if (error || !data || data.business_id !== businessId || !data.cv_path) {
    return { success: false as const, error: 'No CV on this application.' };
  }
  const signed = await supabase.storage.from(BUCKET).createSignedUrl(String(data.cv_path), 60 * 10);
  if (signed.error || !signed.data?.signedUrl) {
    return { success: false as const, error: 'Could not open this CV.' };
  }
  return {
    success: true as const,
    url: signed.data.signedUrl,
    name: String(data.cv_name || 'cv'),
    kind: String(data.cv_kind || ''),
  };
}

export async function shortlistApplication(businessId: string, applicationId: string) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not shortlist this candidate.' };
  const hr = await loadHrContact(businessId);
  if (!hr.email || !hr.mobile) {
    return { success: false as const, error: 'Set your HR email and mobile number before shortlisting.' };
  }
  const { data: application, error } = await supabase
    .from('job_applications')
    .select('id, job_id, full_name, email, user_id, status, business_id')
    .eq('id', applicationId)
    .maybeSingle();
  if (error || !application || application.business_id !== businessId) {
    return { success: false as const, error: 'Application not found.' };
  }
  if (application.status === 'shortlisted') {
    return { success: true as const, already: true };
  }
  const { data: business } = await supabase
    .from('Business')
    .select('businessName, displayName')
    .eq('id', businessId)
    .maybeSingle();
  const { data: job } = await supabase.from('jobs').select('title').eq('id', application.job_id).maybeSingle();
  const businessName = String(business?.displayName || business?.businessName || 'A business').trim();
  const jobTitle = String(job?.title || 'a role').trim();
  const { error: updateError } = await supabase
    .from('job_applications')
    .update({ status: 'shortlisted' })
    .eq('id', applicationId);
  if (updateError) return { success: false as const, error: 'Could not shortlist this candidate.' };

  const text = [
    `Hello ${application.full_name || 'there'},`,
    '',
    `You're shortlisted by ${businessName} for ${jobTitle}.`,
    'Please reach out to their HR on the contact below.',
    '',
    `HR mobile: ${hr.mobile}`,
    `HR email: ${hr.email}`,
    '',
    'FinderB does not conduct interviews or charge any fee for this listing.',
  ].join('\n');

  await sendOwnershipEmail({
    to: String(application.email || ''),
    subject: `You're shortlisted by ${businessName}`,
    text,
  });
  const userId = String(application.user_id || '').trim();
  if (userId) {
    await recordDirectUserNotification({
      userId,
      title: `Shortlisted by ${businessName}`,
      message: `You're shortlisted by ${businessName} HR for ${jobTitle}. Please reach out on ${hr.mobile} or ${hr.email}.`,
      pushBody: `${businessName} shortlisted you. Reach their HR on ${hr.mobile}.`,
    });
  }
  return { success: true as const, already: false };
}

export async function submitJobReport(input: {
  jobId: string;
  reason: string;
  userId?: string | null;
}) {
  const reason = input.reason.trim();
  if (reason.length < 8) return { success: false as const, error: 'Add a short reason for this report.' };
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not send this report.' };
  const { data: job } = await supabase
    .from('jobs')
    .select('id, title, business_id, status')
    .eq('id', input.jobId)
    .maybeSingle();
  if (!job || job.status !== 'active') return { success: false as const, error: 'This job is no longer listed.' };
  const { error } = await supabase.from('job_reports').insert({
    job_id: job.id,
    business_id: job.business_id,
    job_title: job.title,
    reporter_user_id: input.userId || null,
    reason: reason.slice(0, 1000),
    status: 'pending',
  });
  if (error) {
    return { success: false as const, error: 'Could not send this report. Run supabase/job_hiring.sql if this is the first time.' };
  }
  return { success: true as const };
}

export async function listJobReports(status = 'pending') {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not load job reports.', rows: [] };
  let query = supabase
    .from('job_reports')
    .select('id, job_id, business_id, job_title, reason, status, admin_note, created_at')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) return { success: false as const, error: 'Could not load job reports.', rows: [] };
  return { success: true as const, rows: data || [] };
}

export async function moderateJobReport(input: {
  reportId: string;
  action: 'takedown' | 'dismiss';
  adminNote?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not update this report.' };
  const note = String(input.adminNote || '').trim();
  const { data: report, error } = await supabase
    .from('job_reports')
    .select('id, job_id, business_id, job_title, reason, status')
    .eq('id', input.reportId)
    .maybeSingle();
  if (error || !report) return { success: false as const, error: 'Report not found.' };
  if (report.status !== 'pending') return { success: false as const, error: 'This report is already reviewed.' };

  if (input.action === 'dismiss') {
    const { error: updateError } = await supabase
      .from('job_reports')
      .update({ status: 'dismissed', admin_note: note || null })
      .eq('id', report.id);
    if (updateError) return { success: false as const, error: 'Could not dismiss this report.' };
    return { success: true as const };
  }

  const reason = note || String(report.reason || '').trim();
  if (reason.length < 3) return { success: false as const, error: 'A reason is required to take this job down.' };

  await supabase.from('jobs').update({ status: 'removed' }).eq('id', report.job_id);
  await supabase
    .from('job_reports')
    .update({ status: 'removed', admin_note: reason })
    .eq('job_id', report.job_id)
    .eq('status', 'pending');

  const businessId = String(report.business_id || '');
  const { data: business } = await supabase
    .from('Business')
    .select('businessName, displayName, email, workEmail')
    .eq('id', businessId)
    .maybeSingle();
  const title = String(report.job_title || 'Your job');
  const body = `FinderB removed “${title}”. Reason: ${reason}`;
  if (businessId) {
    const notificationId = await recordMerchantNotification({
      businessId,
      type: 'job',
      title: 'Job posting removed',
      body,
    });
    queueBusinessPush({
      businessId,
      type: 'job',
      title: 'Job posting removed',
      body,
      url: '/business-console/jobs',
      notificationId: notificationId || undefined,
    });
  }
  const to = pickPublicBusinessEmail(
    business?.workEmail as string | null,
    business?.email as string | null,
  );
  if (to) {
    await sendOwnershipEmail({
      to,
      subject: `Job posting removed: ${title}`,
      text: `${body}\n\nHiring on FinderB stays between you and the candidate. Update the posting only if it follows the listing rules.`,
    });
  }
  return { success: true as const };
}
