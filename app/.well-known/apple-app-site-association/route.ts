import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * iOS Universal Links association.
 * Set APPLE_TEAM_ID in the website env (e.g. Vercel) for production.
 */
export async function GET() {
  const teamId = (process.env.APPLE_TEAM_ID || '').trim();
  const bundleId = 'com.finderb.app';
  const appID = teamId ? `${teamId}.${bundleId}` : bundleId;

  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID,
          paths: ['/business/*', '/business', '/review/*', '/review'],
        },
      ],
    },
  };

  return new NextResponse(JSON.stringify(body), {
    status: 200,
    headers: {
      // Apple requires this exact content type (no charset)
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
