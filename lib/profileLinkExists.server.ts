import 'server-only';

const NOT_FOUND = [
  "isn't available",
  'isn\u2019t available',
  'page not found',
  "this content isn't available",
  'sorry, this page',
  'video unavailable',
];

async function readPage(url: string): Promise<{ status: number; text: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; FinderBLinkCheck/1.0)',
      },
    });
    const text = (await response.text()).slice(0, 40_000).toLowerCase();
    return { status: response.status, text };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function missing(page: { status: number; text: string } | null): boolean {
  if (!page) return false;
  if (page.status === 404 || page.status === 410) return true;
  return NOT_FOUND.some((phrase) => page.text.includes(phrase));
}

/** Returns an error when a social profile link does not exist. */
export async function socialProfileError(field: string, url: string): Promise<string | null> {
  const label =
    field === 'instagramUrl' ? 'Instagram' : field === 'facebookUrl' ? 'Facebook' : field === 'youtubeUrl' ? 'YouTube' : 'profile';
  if (field === 'youtubeUrl') {
    const oembed = await readPage(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
    );
    if (oembed && oembed.status >= 200 && oembed.status < 300) return null;
    const page = await readPage(url);
    if (page && page.status >= 200 && page.status < 400 && !missing(page)) return null;
    if (!oembed && !page) return `We could not confirm this ${label} profile. Check the link and try again.`;
    return `This ${label} profile does not exist. Paste the link of a live profile.`;
  }

  const page = await readPage(url);
  if (!page) return `We could not confirm this ${label} profile. Check the link and try again.`;
  if (missing(page)) return `This ${label} profile does not exist. Paste the link of a live profile.`;
  if (page.status >= 200 && page.status < 400) return null;
  return `This ${label} profile does not exist. Paste the link of a live profile.`;
}
