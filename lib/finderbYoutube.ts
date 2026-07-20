import { FINDERB_SOCIAL_URLS } from '@/lib/finderbSocial';
import { getPublicSupabase } from '@/lib/supabase/public';

/** Official FinderB YouTube channel — RSS feed source (fallback only) */
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

export type FinderBTutorialPlaylist = {
  id: string;
  title: string;
  description: string | null;
  videos: FinderBTutorialVideo[];
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

const YOUTUBE_VIDEO_ID_RE = /^[a-zA-Z0-9_-]{11}$/;

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

export function youtubeWatchUrl(videoId: string, isShort = false): string {
  return isShort
    ? `https://www.youtube.com/shorts/${videoId}`
    : `https://www.youtube.com/watch?v=${videoId}`;
}

/** Extract an 11-char YouTube video id from common URL shapes or a bare id. */
export function parseYoutubeVideoUrl(input: string): {
  videoId: string;
  isShort: boolean;
  watchUrl: string;
} | null {
  const raw = input.trim();
  if (!raw) return null;

  if (YOUTUBE_VIDEO_ID_RE.test(raw)) {
    return { videoId: raw, isShort: false, watchUrl: youtubeWatchUrl(raw) };
  }

  let url: URL;
  try {
    url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (!['youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtu.be'].includes(host)) {
    return null;
  }

  let videoId: string | null = null;
  let isShort = false;

  if (host === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0] ?? null;
  } else {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0] === 'shorts' || parts[0] === 'embed' || parts[0] === 'live' || parts[0] === 'v') {
      videoId = parts[1] ?? null;
      isShort = parts[0] === 'shorts';
    } else {
      videoId = url.searchParams.get('v');
    }
  }

  if (!videoId || !YOUTUBE_VIDEO_ID_RE.test(videoId)) return null;

  return {
    videoId,
    isShort,
    watchUrl: youtubeWatchUrl(videoId, isShort),
  };
}

type AdminPlaylistRow = {
  id: string;
  title: string;
  description: string | null;
  sort_order: number | null;
};

type AdminVideoRow = {
  id: string;
  playlist_id: string;
  youtube_video_id: string;
  title: string;
  description: string | null;
  topic: string | null;
  thumbnail_url: string;
  watch_url: string;
  sort_order: number | null;
  created_at: string | null;
};

function mapAdminVideo(row: AdminVideoRow, index: number): FinderBTutorialVideo {
  const isShort = row.watch_url.includes('/shorts/');
  return enrichVideo(
    {
      id: row.youtube_video_id,
      title: row.title,
      description: row.description || '',
      topic: row.topic || undefined,
      publishedAt: row.created_at,
      thumbnailUrl: row.thumbnail_url || youtubeThumbnailUrl(row.youtube_video_id),
      watchUrl: row.watch_url || youtubeWatchUrl(row.youtube_video_id, isShort),
      isShort,
    },
    index
  );
}

export async function fetchAdminTutorialPlaylists(): Promise<FinderBTutorialPlaylist[]> {
  try {
    const supabase = getPublicSupabase();

    const { data: playlistRows, error: playlistError } = await supabase
      .from('youtube_playlists')
      .select('id, title, description, sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (playlistError) {
      console.error('[finderbYoutube] admin playlists fetch failed:', playlistError.message);
      return [];
    }

    const playlists = (playlistRows ?? []) as AdminPlaylistRow[];
    if (!playlists.length) return [];

    const playlistIds = playlists.map((p) => p.id);
    const { data: videoRows, error: videoError } = await supabase
      .from('youtube_videos')
      .select(
        'id, playlist_id, youtube_video_id, title, description, topic, thumbnail_url, watch_url, sort_order, created_at'
      )
      .in('playlist_id', playlistIds)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (videoError) {
      console.error('[finderbYoutube] admin videos fetch failed:', videoError.message);
      return [];
    }

    const videosByPlaylist = new Map<string, FinderBTutorialVideo[]>();
    for (const row of (videoRows ?? []) as AdminVideoRow[]) {
      const list = videosByPlaylist.get(row.playlist_id) ?? [];
      list.push(mapAdminVideo(row, list.length));
      videosByPlaylist.set(row.playlist_id, list);
    }

    return playlists
      .map((playlist) => ({
        id: playlist.id,
        title: playlist.title,
        description: playlist.description,
        videos: videosByPlaylist.get(playlist.id) ?? [],
      }))
      .filter((playlist) => playlist.videos.length > 0);
  } catch (error) {
    console.error('[finderbYoutube] admin playlists failed:', error);
    return [];
  }
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

/** Prefer admin-curated playlists; fall back to RSS as a single synthetic playlist. */
export async function fetchFinderBTutorialPlaylists(): Promise<FinderBTutorialPlaylist[]> {
  const adminPlaylists = await fetchAdminTutorialPlaylists();
  if (adminPlaylists.length > 0) return adminPlaylists;

  const rssVideos = await fetchFinderBTutorials(6);
  if (!rssVideos.length) return [];

  return [
    {
      id: 'rss-latest',
      title: 'Latest from FinderB',
      description: 'Recent videos from the official FinderB YouTube channel.',
      videos: rssVideos,
    },
  ];
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
