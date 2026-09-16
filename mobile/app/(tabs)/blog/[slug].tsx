import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { useLoginPrompt } from '../../../context/LoginPromptContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchBlogEngagement,
  formatCommentDate,
  setBlogRating,
  submitBlogComment,
  toggleBlogBookmark,
  type BlogComment,
  type BlogEngagement,
} from '../../../lib/blogEngagement';
import {
  blogHtmlToParagraphs,
  fetchBlogBySlug,
  type BlogPost,
} from '../../../lib/blogs';
import { SITE_URL } from '../../../lib/supabase';

function param(value: string | string[] | undefined): string {
  return typeof value === 'string'
    ? value
    : Array.isArray(value)
      ? value[0] || ''
      : '';
}

function StarRow({
  value,
  size = 22,
  onChange,
}: {
  value: number;
  size?: number;
  onChange?: (rating: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          hitSlop={6}
          disabled={!onChange}
          onPress={() => onChange?.(n)}
          accessibilityRole={onChange ? 'button' : undefined}
          accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
        >
          <Ionicons
            name={n <= value ? 'star' : 'star-outline'}
            size={size}
            color={n <= value ? colors.star : colors.borderStrong}
          />
        </Pressable>
      ))}
    </View>
  );
}

export default function BlogDetailScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const params = useLocalSearchParams<{ slug?: string }>();
  const slug = param(params.slug);
  const bottomPad = useTabScrollPadding(28);
  const { width: windowWidth } = useWindowDimensions();

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [engagement, setEngagement] = useState<BlogEngagement | null>(null);
  const [draftRating, setDraftRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [heroAspect, setHeroAspect] = useState(16 / 10);

  const loadEngagement = useCallback(
    async (blogId: string) => {
      const data = await fetchBlogEngagement(blogId, user?.id);
      setEngagement(data);
      setDraftRating(data.userRating || 0);
    },
    [user?.id],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const result = await fetchBlogBySlug(slug);
      if (cancelled) return;
      setBlog(result.blog);
      setError(result.error || '');
      setLoading(false);
      if (result.blog?.id) {
        await loadEngagement(result.blog.id);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadEngagement, slug]);

  const paragraphs = useMemo(
    () => (blog?.content ? blogHtmlToParagraphs(blog.content) : []),
    [blog?.content],
  );

  const shareUrl = blog
    ? `${SITE_URL}/blog/${blog.slug || blog.id}`
    : SITE_URL;
  const appShareUrl = blog
    ? `finderb://blog/${encodeURIComponent(blog.slug || blog.id)}`
    : 'finderb://';

  const onShare = async () => {
    if (!blog) return;
    try {
      await Share.share({
        message: `${blog.title}\n\n${shareUrl}\n\nPrefer the app? ${appShareUrl}`,
        title: blog.title,
        url: shareUrl,
      });
    } catch {
      /* user cancelled */
    }
  };

  const onToggleBookmark = async () => {
    if (!blog) return;
    const next = await toggleBlogBookmark(blog.id, {
      slug: blog.slug,
      title: blog.title,
      image: blog.image,
    });
    setEngagement((prev) =>
      prev ? { ...prev, bookmarked: next } : prev,
    );
  };

  const onRate = async (rating: number) => {
    if (!blog) return;
    if (!user) {
      Alert.alert('Sign in required', 'Please sign in to rate this article.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign in', onPress: () => requestLogin(`/blog/${slug}`) },
      ]);
      return;
    }
    setDraftRating(rating);
    const result = await setBlogRating({
      blogId: blog.id,
      rating,
      userId: user.id,
    });
    if (!result.ok) {
      Alert.alert('Rating', result.error || 'Could not save rating');
      return;
    }
    await loadEngagement(blog.id);
    setFormSuccess('Thanks for rating this article');
  };

  const onSubmitComment = async () => {
    if (!blog) return;
    setFormError('');
    setFormSuccess('');

    if (!user) {
      setFormError('Please sign in to comment');
      return;
    }

    const authorName = user.fullName?.trim() || 'FinderB user';
    if (commentText.trim().length < 4) {
      setFormError('Write at least a few words');
      return;
    }

    setSubmitting(true);
    const result = await submitBlogComment({
      blogId: blog.id,
      authorName,
      content: commentText,
      rating: draftRating > 0 ? draftRating : undefined,
      userId: user.id,
    });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error || 'Could not post comment');
      return;
    }

    setCommentText('');
    setFormSuccess('Comment posted');
    await loadEngagement(blog.id);
  };

  const comments: BlogComment[] = engagement?.comments ?? [];

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Article"
          variant="bar"
          onBack={() => router.replace('/(tabs)/blog')}
          right={
            blog ? (
              <View style={styles.headerActions}>
                <Pressable
                  onPress={() => void onToggleBookmark()}
                  hitSlop={8}
                  style={styles.headerBtn}
                  accessibilityLabel={
                    engagement?.bookmarked ? 'Remove bookmark' : 'Bookmark'
                  }
                >
                  <Ionicons
                    name={engagement?.bookmarked ? 'bookmark' : 'bookmark-outline'}
                    size={20}
                    color={engagement?.bookmarked ? colors.brand : colors.ink}
                  />
                </Pressable>
                <Pressable
                  onPress={() => void onShare()}
                  hitSlop={8}
                  style={styles.headerBtn}
                  accessibilityLabel="Share article"
                >
                  <Ionicons name="share-outline" size={20} color={colors.ink} />
                </Pressable>
              </View>
            ) : null
          }
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
            <Text style={styles.loadingText}>Loading article…</Text>
          </View>
        ) : !blog ? (
          <View style={styles.center}>
            <Text style={styles.emptyTitle}>Article not found</Text>
            <Text style={styles.emptyText}>
              {error || 'This blog post may have been removed.'}
            </Text>
          </View>
        ) : (
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.scroll,
                { paddingBottom: bottomPad },
              ]}
            >
              <View
                style={[
                  styles.heroWrap,
                  {
                    width: windowWidth,
                    height: Math.min(
                      windowWidth / heroAspect,
                      windowWidth * 0.9,
                    ),
                  },
                ]}
              >
                <Image
                  source={{ uri: blog.image }}
                  style={styles.hero}
                  contentFit="contain"
                  onLoad={(e) => {
                    const src = e.source;
                    if (src?.width && src?.height) {
                      setHeroAspect(src.width / src.height);
                    }
                  }}
                />
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{blog.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={colors.textSoft}
                  />
                  <Text style={styles.meta}>{blog.date}</Text>
                  {blog.author ? (
                    <>
                      <Text style={styles.metaDot}>·</Text>
                      <Ionicons
                        name="person-outline"
                        size={14}
                        color={colors.textSoft}
                      />
                      <Text style={styles.meta}>{blog.author}</Text>
                    </>
                  ) : null}
                </View>

                {engagement && engagement.ratingCount > 0 ? (
                  <View style={styles.ratingSummary}>
                    <Ionicons name="star" size={16} color={colors.star} />
                    <Text style={styles.ratingAvg}>
                      {engagement.averageRating.toFixed(1)}
                    </Text>
                    <Text style={styles.ratingCount}>
                      ({engagement.ratingCount} rating
                      {engagement.ratingCount === 1 ? '' : 's'})
                    </Text>
                  </View>
                ) : null}

                {blog.excerpt ? (
                  <Text style={styles.excerpt}>{blog.excerpt}</Text>
                ) : null}

                {paragraphs.length > 0 ? (
                  <View style={styles.article}>
                    {paragraphs.map((p, index) => (
                      <Text
                        key={`${index}-${p.slice(0, 12)}`}
                        style={styles.paragraph}
                      >
                        {p}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.paragraph}>
                    Article content is currently unavailable.
                  </Text>
                )}

                <View style={styles.actionBar}>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => void onShare()}
                  >
                    <Ionicons
                      name="share-social-outline"
                      size={18}
                      color={colors.ink}
                    />
                    <Text style={styles.actionText}>Share</Text>
                  </Pressable>
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => void onToggleBookmark()}
                  >
                    <Ionicons
                      name={
                        engagement?.bookmarked ? 'bookmark' : 'bookmark-outline'
                      }
                      size={18}
                      color={colors.ink}
                    />
                    <Text style={styles.actionText}>
                      {engagement?.bookmarked ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>Rate this article</Text>
                  <Text style={styles.sectionSub}>
                    {user
                      ? 'Tap a star to leave your rating'
                      : 'Sign in to rate this article'}
                  </Text>
                  <StarRow
                    value={draftRating}
                    onChange={(n) => void onRate(n)}
                  />
                  {engagement?.userRating ? (
                    <Text style={styles.yourRating}>
                      Your rating: {engagement.userRating}/5
                    </Text>
                  ) : null}
                </View>

                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>
                    Comments ({comments.length})
                  </Text>

                  {!user ? (
                    <View style={styles.loginGate}>
                      <Text style={styles.loginGateText}>
                        Sign in with your FinderB account to join the discussion.
                      </Text>
                      <Pressable
                        style={styles.loginBtn}
                        onPress={() => requestLogin(`/blog/${slug}`)}
                      >
                        <Text style={styles.loginBtnText}>Sign in to comment</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.signedAs}>
                        Commenting as {user.fullName}
                      </Text>
                      <Text style={styles.fieldLabel}>Your comment</Text>
                      <TextInput
                        style={[styles.input, styles.commentBox]}
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder="Share your thoughts…"
                        placeholderTextColor={colors.textSoft}
                        multiline
                        textAlignVertical="top"
                      />

                      <View style={styles.commentRateRow}>
                        <Text style={styles.fieldLabel}>Optional rating</Text>
                        <StarRow
                          value={draftRating}
                          size={18}
                          onChange={setDraftRating}
                        />
                      </View>

                      {formError ? (
                        <Text style={styles.formError}>{formError}</Text>
                      ) : null}
                      {formSuccess ? (
                        <Text style={styles.formSuccess}>{formSuccess}</Text>
                      ) : null}

                      <Pressable
                        style={[
                          styles.postBtn,
                          submitting && styles.postBtnDisabled,
                        ]}
                        onPress={() => void onSubmitComment()}
                        disabled={submitting}
                      >
                        {submitting ? (
                          <ActivityIndicator color={colors.white} />
                        ) : (
                          <Text style={styles.postBtnText}>Post comment</Text>
                        )}
                      </Pressable>
                    </>
                  )}

                  <View style={styles.commentList}>
                    {comments.length === 0 ? (
                      <Text style={styles.noComments}>
                        Be the first to comment on this article.
                      </Text>
                    ) : (
                      comments.map((item) => (
                        <View key={item.id} style={styles.commentItem}>
                          <View style={styles.commentHead}>
                            <View style={styles.avatar}>
                              <Text style={styles.avatarText}>
                                {item.authorName.slice(0, 1).toUpperCase()}
                              </Text>
                            </View>
                            <View style={styles.commentHeadCopy}>
                              <Text style={styles.commentAuthor}>
                                {item.authorName}
                              </Text>
                              <Text style={styles.commentDate}>
                                {formatCommentDate(item.createdAt)}
                              </Text>
                            </View>
                            {item.rating ? (
                              <View style={styles.commentStars}>
                                <Ionicons
                                  name="star"
                                  size={12}
                                  color={colors.star}
                                />
                                <Text style={styles.commentRating}>
                                  {item.rating}
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text style={styles.commentBody}>{item.content}</Text>
                        </View>
                      ))
                    )}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  flex: { flex: 1 },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  scroll: {
    paddingBottom: 24,
  },
  heroWrap: {
    backgroundColor: colors.muted,
    overflow: 'hidden',
  },
  hero: {
    width: '100%',
    height: '100%',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  metaDot: {
    color: colors.textSoft,
  },
  ratingSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingAvg: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  ratingCount: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  excerpt: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    marginTop: 4,
  },
  article: {
    marginTop: 8,
    gap: 14,
  },
  paragraph: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 24,
    color: colors.ink,
  },
  actionBar: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  actionText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  sectionCard: {
    marginTop: 8,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  sectionTitle: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.heading,
  },
  sectionSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: -4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  yourRating: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  loginGate: {
    gap: 10,
    paddingVertical: 4,
  },
  loginGateText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  loginBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.brand,
  },
  loginBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.white,
  },
  fieldLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceSoft,
  },
  commentBox: {
    minHeight: 96,
    paddingTop: 12,
  },
  signedAs: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  commentRateRow: {
    gap: 8,
  },
  formError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
  },
  formSuccess: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
  },
  postBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.brand,
  },
  postBtnDisabled: { opacity: 0.7 },
  postBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.white,
  },
  commentList: {
    marginTop: 6,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  noComments: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSoft,
  },
  commentItem: {
    gap: 8,
  },
  commentHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  avatarText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.brand,
  },
  commentHeadCopy: {
    flex: 1,
    minWidth: 0,
  },
  commentAuthor: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  commentDate: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
  },
  commentStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentRating: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  commentBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    paddingLeft: 42,
  },
}));
