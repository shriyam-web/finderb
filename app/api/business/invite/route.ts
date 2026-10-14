import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { acceptTeamInvite, getTeamInvitePreview } from '@/lib/businessTeam/teamInvites.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    action?: string;
    token?: string;
    password?: string;
  } | null;
  const token = String(body?.token || '').trim();
  if (!token) return mobileApiJson({ success: false, error: 'Invite token is required.' }, 400);

  if (body?.action === 'preview') {
    return mobileApiJson(await getTeamInvitePreview(token));
  }
  if (body?.action === 'accept') {
    return mobileApiJson(await acceptTeamInvite({ token, password: String(body.password || '') }));
  }
  return mobileApiJson({ success: false, error: 'Unknown action.' }, 400);
}
