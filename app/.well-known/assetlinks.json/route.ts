import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Android App Links verification.
 * Add production / Play App Signing SHA-256 fingerprints via
 * ANDROID_APP_LINK_SHA256 (comma-separated, with or without colons).
 */
export async function GET() {
  const defaults = [
    // FinderB release upload key
    '64:32:06:1E:21:5A:A2:68:18:D8:0E:4D:D4:81:20:78:AF:9A:07:94:1B:87:F3:6B:8A:7B:AA:0D:89:FB:20:47',
  ];
  // Debug keystores are shared publicly, so they must never be trusted for production links.
  if (process.env.VERCEL_ENV !== 'production') {
    defaults.push(
      'FA:C6:17:45:DC:09:03:78:6F:B9:ED:E6:2A:96:2B:39:9F:73:48:F0:BB:6F:89:9B:83:32:66:75:91:03:3B:9C',
      '9A:D0:C2:39:F5:47:7F:E5:B3:C3:AD:3F:49:82:79:2F:2B:8E:0D:D8:C0:29:31:24:19:7D:34:72:98:F5:49:42',
    );
  }

  const fromEnv = (process.env.ANDROID_APP_LINK_SHA256 || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) =>
      s.includes(':')
        ? s.toUpperCase()
        : (s.toUpperCase().match(/.{1,2}/g) || []).join(':'),
    );

  const fingerprints = [...new Set([...fromEnv, ...defaults])];

  const body = [
    {
      relation: ['delegate_permission/common.handle_all_urls'],
      target: {
        namespace: 'android_app',
        package_name: 'com.finderb.app',
        sha256_cert_fingerprints: fingerprints,
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
