import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';

export type BlogComment = {
  id: string;
  blogId: string;
  authorName: string;
  content: string;
  rating?: number;
  createdAt: string;
  userKey?: string;
};

export type BlogEngagement = {
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
  comments: BlogComment[];
  bookmarked: boolean;
};

export type BlogBookmarkMeta = {
  id: string;
  slug: string;
  title: string;
  image: string;
  savedAt: string;
};

const LOCAL_PREFIX = '@finderb/blog-engagement:';
const DEVICE_KEY = '@finderb/device-key';
const BOOKMARK_INDEX_KEY = '@finderb/blog-bookmarks-index-v1';

function localKey(blogId: string) {
  return `${LOCAL_PREFIX}${blogId}`;
}

type LocalBundle = {
  userRating: number | null;
  comments: BlogComment[];
  bookmarked: boolean;
};

async function getDeviceKey(): Promise<string> {
  const existing = await AsyncStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const next = `device_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(DEVICE_KEY, next);
  return next;
}

async function readLocal(blogId: string): Promise<LocalBundle> {
  try {
    const raw = await AsyncStorage.getItem(localKey(blogId));
    if (!raw) return { userRating: null, comments: [], bookmarked: false };
    const parsed = JSON.parse(raw) as LocalBundle;
    return {
      userRating: parsed.userRating ?? null,
      comments: Array.isArray(parsed.comments) ? parsed.comments : [],
      bookmarked: Boolean(parsed.bookmarked),
    };
  } catch {
    return { userRating: null, comments: [], bookmarked: false };
  }
}

async function writeLocal(blogId: string, bundle: LocalBundle) {
  await AsyncStorage.setItem(localKey(blogId), JSON.stringify(bundle));
}

async function readBookmarkIndex(): Promise<BlogBookmarkMeta[]> {
  try {
    const raw = await AsyncStorage.getItem(BOOKMARK_INDEX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          id: String(row.id || ''),
          slug: String(row.slug || row.id || ''),
          title: String(row.title || 'Saved article'),
          image: String(row.image || ''),
          savedAt: String(row.savedAt || new Date().toISOString()),
        };
      })
      .filter((item) => item.id);
  } catch {
    return [];
  }
}

async function writeBookmarkIndex(items: BlogBookmarkMeta[]) {
  await AsyncStorage.setItem(BOOKMARK_INDEX_KEY, JSON.stringify(items.slice(0, 100)));
}

function averageFrom(ratings: number[]): { average: number; count: number } {
  if (!ratings.length) return { average: 0, count: 0 };
  const sum = ratings.reduce((a, b) => a + b, 0);
  return {
    average: Math.round((sum / ratings.length) * 10) / 10,
    count: ratings.length,
  };
}

export async function fetchBlogEngagement(
  blogId: string,
  userId?: string | null,
): Promise<BlogEngagement> {
  const userKey = userId || (await getDeviceKey());
  const local = await readLocal(blogId);

  if (!isSupabaseConfigured || !supabase) {
    const ratings = [
      ...local.comments.map((c) => c.rating).filter((r): r is number => !!r),
      ...(local.userRating ? [local.userRating] : []),
    ];
    const { average, count } = averageFrom(ratings);
    return {
      averageRating: average,
      ratingCount: count,
      userRating: local.userRating,
      comments: [...local.comments].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
      bookmarked: local.bookmarked,
    };
  }

  const [ratingsRes, commentsRes] = await Promise.all([
    supabase
      .from('blog_ratings')
      .select('rating, user_key')
      .eq('blog_id', blogId),
    supabase
      .from('blog_comments')
      .select('id, blog_id, user_key, author_name, content, rating, created_at')
      .eq('blog_id', blogId)
      .order('created_at', { ascending: false })
      .limit(80),
  ]);

  // Tables missing / RLS issue → fall back to local-only engagement.
  if (ratingsRes.error || commentsRes.error) {
    const ratings = [
      ...local.comments.map((c) => c.rating).filter((r): r is number => !!r),
      ...(local.userRating ? [local.userRating] : []),
    ];
    const { average, count } = averageFrom(ratings);
    return {
      averageRating: average,
      ratingCount: count,
      userRating: local.userRating,
      comments: local.comments,
      bookmarked: local.bookmarked,
    };
  }

  const remoteRatings = (ratingsRes.data ?? []).map((row) => Number(row.rating));
  const userRow = (ratingsRes.data ?? []).find((row) => row.user_key === userKey);
  const remoteComments: BlogComment[] = (commentsRes.data ?? []).map((row) => ({
    id: String(row.id),
    blogId: String(row.blog_id),
    authorName: String(row.author_name || 'Reader'),
    content: String(row.content || '').trim(),
    rating:
      row.rating != null && Number(row.rating) > 0
        ? Number(row.rating)
        : undefined,
    createdAt: String(row.created_at || new Date().toISOString()),
    userKey: row.user_key ? String(row.user_key) : undefined,
  }));

  // Merge local-only comments that aren't on server yet.
  const remoteIds = new Set(remoteComments.map((c) => c.id));
  const mergedComments = [
    ...remoteComments,
    ...local.comments.filter((c) => !remoteIds.has(c.id)),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const { average, count } = averageFrom(remoteRatings);
  return {
    averageRating: average,
    ratingCount: count,
    userRating: userRow ? Number(userRow.rating) : local.userRating,
    comments: mergedComments,
    bookmarked: local.bookmarked,
  };
}

export async function setBlogRating(input: {
  blogId: string;
  rating: number;
  userId?: string | null;
}): Promise<{ ok: boolean; error?: string }> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const userKey = input.userId || (await getDeviceKey());
  const local = await readLocal(input.blogId);
  local.userRating = rating;
  await writeLocal(input.blogId, local);

  if (!isSupabaseConfigured || !supabase) return { ok: true };

  const { error } = await supabase.from('blog_ratings').upsert(
    {
      blog_id: input.blogId,
      user_key: userKey,
      rating,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'blog_id,user_key' },
  );

  if (error) {
    // Local save still succeeded.
    return { ok: true, error: error.message };
  }
  return { ok: true };
}

export async function submitBlogComment(input: {
  blogId: string;
  authorName: string;
  content: string;
  rating?: number;
  userId?: string | null;
}): Promise<{ ok: boolean; comment?: BlogComment; error?: string }> {
  const content = input.content.trim();
  const authorName = input.authorName.trim() || 'Reader';
  if (content.length < 4) {
    return { ok: false, error: 'Write a bit more in your comment' };
  }

  const userKey = input.userId || (await getDeviceKey());
  const comment: BlogComment = {
    id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    blogId: input.blogId,
    authorName,
    content,
    rating: input.rating && input.rating > 0 ? input.rating : undefined,
    createdAt: new Date().toISOString(),
    userKey,
  };

  const local = await readLocal(input.blogId);
  local.comments = [comment, ...local.comments].slice(0, 100);
  if (comment.rating) local.userRating = comment.rating;
  await writeLocal(input.blogId, local);

  if (comment.rating) {
    await setBlogRating({
      blogId: input.blogId,
      rating: comment.rating,
      userId: input.userId,
    });
  }

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, comment };
  }

  const { data, error } = await supabase
    .from('blog_comments')
    .insert({
      blog_id: input.blogId,
      user_key: userKey,
      author_name: authorName,
      content,
      rating: comment.rating ?? null,
    })
    .select('id, blog_id, user_key, author_name, content, rating, created_at')
    .maybeSingle();

  if (error || !data) {
    return { ok: true, comment, error: error?.message };
  }

  const remoteComment: BlogComment = {
    id: String(data.id),
    blogId: String(data.blog_id),
    authorName: String(data.author_name || authorName),
    content: String(data.content || content),
    rating:
      data.rating != null && Number(data.rating) > 0
        ? Number(data.rating)
        : undefined,
    createdAt: String(data.created_at || comment.createdAt),
    userKey: data.user_key ? String(data.user_key) : userKey,
  };

  // Replace local temp id with server id.
  local.comments = [
    remoteComment,
    ...local.comments.filter((c) => c.id !== comment.id),
  ];
  await writeLocal(input.blogId, local);

  return { ok: true, comment: remoteComment };
}

export async function toggleBlogBookmark(
  blogId: string,
  meta?: {
    slug?: string;
    title?: string;
    image?: string;
  },
): Promise<boolean> {
  const local = await readLocal(blogId);
  local.bookmarked = !local.bookmarked;
  await writeLocal(blogId, local);

  const index = await readBookmarkIndex();
  if (local.bookmarked) {
    const next: BlogBookmarkMeta = {
      id: blogId,
      slug: meta?.slug?.trim() || blogId,
      title: meta?.title?.trim() || 'Saved article',
      image: meta?.image?.trim() || '',
      savedAt: new Date().toISOString(),
    };
    const without = index.filter((item) => item.id !== blogId);
    await writeBookmarkIndex([next, ...without]);
  } else {
    await writeBookmarkIndex(index.filter((item) => item.id !== blogId));
  }

  return local.bookmarked;
}

export async function listBookmarkedBlogs(): Promise<BlogBookmarkMeta[]> {
  const index = await readBookmarkIndex();
  // Reconcile with per-blog flags in case index drifted
  const kept: BlogBookmarkMeta[] = [];
  for (const item of index) {
    const local = await readLocal(item.id);
    if (local.bookmarked) kept.push(item);
  }
  if (kept.length !== index.length) {
    await writeBookmarkIndex(kept);
  }
  return kept;
}

export function formatCommentDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}
