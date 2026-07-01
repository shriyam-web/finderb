import { FINDERB_SOCIAL_URLS } from '@/lib/finderbSocial';

/** Official FinderB YouTube channel — RSS feed source */
export const FINDERB_YOUTUBE_CHANNEL_ID = 'UC7ZEL-97eTiAl2fFG7xMWEw';

export const FINDERB_YOUTUBE_CHANNEL_URL = FINDERB_SOCIAL_URLS.youtube;

export type FinderBTutorialVideo = {
  id: string;
  title: string;
  description: string;
  topic: string;
  publishedAt: string | null;
  thumbnailUrl: string;
  watchUrl: string;
  isShort: boolean;
};

/** Rich copy when YouTube titles/descriptions are sparse */
const TUTORIAL_OVERRIDES: Record<
  string,
  Partial<Pick<FinderBTutorialVideo, 'title' | 'description' | 'topic'>>
> = {
  kFXeN9FOjCU: {
    title: 'Introducing FinderB',
    description:
      'A quick look at how FinderB helps you discover trusted local businesses and how merchants can list on the platform.',
    topic: 'Getting started',
  },
};

const TOPIC_FALLBACKS = [
  'Local discovery',
  'For merchants',
  'List your business',
  'Grow with FinderB',
  'Platform tips',
];

function decodeXml(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function pickTopic(title: string, index: number): string {
  const lower = title.toLowerCase();
  if (/merchant|business|list|partner|register/.test(lower)) return 'For merchants';
  if (/search|find|discover|local/.test(lower)) return 'Local discovery';
  if (/review|trust|verified/.test(lower)) return 'Trust & reviews';
  if (/dashboard|lead|grow/.test(lower)) return 'Grow with FinderB';
  return TOPIC_FALLBACKS[index % TOPIC_FALLBACKS.length];
}

function enrichVideo(
  video: Omit<FinderBTutorialVideo, 'topic'> & { topic?: string },
  index: number
): FinderBTutorialVideo {
  const override = TUTORIAL_OVERRIDES[video.id];
  const title = override?.title || video.title;
  const description =
    override?.description ||
    video.description ||
    'Step-by-step guidance from the FinderB team — search smarter, list faster, grow locally.';
  const topic = override?.topic || video.topic || pickTopic(title, index);

  return {
    ...video,
    title,
    description,
    topic,
  };
}

function parseYoutubeFeedXml(xml: string): FinderBTutorialVideo[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

  return entries
    .map((match, index) => {
      const block = match[1];
      const id = block.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1]?.trim();
      if (!id) return null;

      const rawTitle = decodeXml(block.match(/<title>([^<]+)<\/title>/)?.[1]?.trim() || 'FinderB tutorial');
      const link = block.match(/<link rel="alternate" href="([^"]+)"/)?.[1]?.trim();
      const publishedAt = block.match(/<published>([^<]+)<\/published>/)?.[1]?.trim() || null;
      const description = decodeXml(
        block.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1]?.trim() || ''
      );
      const thumbFromFeed = block.match(/<media:thumbnail url="([^"]+)"/)?.[1]?.trim();

      const isShort = link?.includes('/shorts/') ?? false;
      const watchUrl = link || `https://www.youtube.com/watch?v=${id}`;

      return enrichVideo(
        {
          id,
          title: rawTitle,
          description,
          publishedAt,
          thumbnailUrl: thumbFromFeed || youtubeThumbnailUrl(id),
          watchUrl,
          isShort,
        },
        index
      );
    })
    .filter((video): video is FinderBTutorialVideo => video !== null);
}

export function youtubeThumbnailUrl(videoId: string, quality: 'hq' | 'max' = 'hq'): string {
  return quality === 'max'
    ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
    : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
}

export async function fetchFinderBTutorials(limit = 6): Promise<FinderBTutorialVideo[]> {
  try {
    const response = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${FINDERB_YOUTUBE_CHANNEL_ID}`,
      {
        next: { revalidate: 3600 },
        headers: { 'User-Agent': 'FinderB/1.0 (+https://finderb.com)' },
      }
    );

    if (!response.ok) {
      console.error('[finderbYoutube] RSS fetch failed:', response.status);
      return [];
    }

    const xml = await response.text();
    return parseYoutubeFeedXml(xml).slice(0, limit);
  } catch (error) {
    console.error('[finderbYoutube] RSS parse failed:', error);
    return [];
  }
}

export function formatTutorialDate(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return null;
  }
}
