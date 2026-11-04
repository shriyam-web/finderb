import type { Href } from 'expo-router';

/** Website dashboard links (alerts, pushes) open the matching business panel screen instead of the browser. */
export function consoleRouteFor(url: string): Href | null {
  const lower = url.toLowerCase();
  if (/[?&]tab=account\b|\/account\b/.test(lower)) return '/business-console/account';
  if (/subscription|pricing|payment|plan/.test(lower)) return '/business-console/plan';
  if (/lead/.test(lower)) return '/business-console/leads';
  if (/review/.test(lower)) {
    try {
      const parsed = new URL(url, 'https://finderb.com');
      const reviewId = parsed.searchParams.get('reviewId')?.trim();
      if (reviewId) {
        return { pathname: '/business-console/reviews', params: { reviewId } };
      }
    } catch {
      // relative dashboard links still match below
    }
    const reviewId = /reviewid=([^&]+)/i.exec(url)?.[1];
    if (reviewId) {
      return { pathname: '/business-console/reviews', params: { reviewId: decodeURIComponent(reviewId) } };
    }
    return '/business-console/reviews';
  }
  if (/job/.test(lower)) return '/business-console/jobs';
  if (/photo|media|gallery/.test(lower)) return '/business-console/photos';
  if (/setting|profile|listing/.test(lower)) return '/business-console/listing';
  if (/notification|alert/.test(lower)) return '/business-console/alerts';
  if (/business\/dashboard|business-console/.test(lower)) return '/business-console';
  return null;
}
