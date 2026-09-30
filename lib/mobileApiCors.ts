import { NextResponse } from 'next/server';

/** Expo web calls these routes from another origin, so the browser requires CORS. */
export const MOBILE_API_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Authorization',
  'Access-Control-Max-Age': '86400',
} as const;

export function mobileApiOptions() {
  return new NextResponse(null, { status: 204, headers: MOBILE_API_CORS });
}

export function mobileApiJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: MOBILE_API_CORS });
}
