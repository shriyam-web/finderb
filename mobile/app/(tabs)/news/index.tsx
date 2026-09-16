import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NewsImagePlaceholder } from '../../../components/NewsImagePlaceholder';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { isUsableNewsImage } from '../../../constants/newsCategories';
import { fonts } from '../../../constants/typography';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import { useUserLocation } from '../../../hooks/useUserLocation';
import { fetchNewsArticles, peekNewsArticles, type NewsArticle } from '../../../lib/news';
import { backToMore } from '../../../lib/navigation';
import { openNewsArticle } from '../../../lib/openNewsArticle';

const CATEGORIES = [
  { id: 'local', label: 'Local' },
  { id: 'politics', label: 'Politics' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'technology', label: 'Tech' },
  { id: 'bollywood', label: 'Entertainment' },
] as const;

function NewsListThumb({
  article,
  category,
  style,
  iconSize = 18,
  showLabel = false,
}: {
  article: NewsArticle;
  category: string;
  style: object;
  iconSize?: number;
  showLabel?: boolean;
}) {
  const sourceUri = isUsableNewsImage(article.image) ? article.image!.trim() : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [sourceUri, article.link, article.id]);

  if (!sourceUri || failed) {
    return (
      <NewsImagePlaceholder
        categorySlug={article.categorySlug || category}
        style={style}
        iconSize={iconSize}
        showLabel={showLabel}
      />
    );
  }

  return (
    <Image
      source={{ uri: sourceUri }}
      style={style}
      contentFit="cover"
      onError={() => setFailed(true)}
    />
  );
}

export default function NewsScreen() {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const location = useUserLocation(true);
  const bottomPad = useTabScrollPadding(24);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]['id']>('local');
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (force = false) => {
    const opts = {
      category,
      lang: 'hi' as const,
      city: location.city,
      state: location.region,
      limit: 24,
    };
    if (!force) {
      const cached = peekNewsArticles(opts);
      if (cached?.articles.length) {
        setArticles(cached.articles);
        setError(cached.error || '');
        setLoading(false);
        return;
      }
    }
    setError('');
    const result = await fetchNewsArticles({ ...opts, force });
    if (result.articles.length === 0) {
      const en = await fetchNewsArticles({
        category,
        lang: 'en',
        city: location.city,
        state: location.region,
        limit: 24,
        force,
      });
      setArticles(en.articles);
      setError(en.error || result.error || '');
    } else {
      setArticles(result.articles);
      setError(result.error || '');
    }
    setLoading(false);
  }, [category, location.city, location.region]);

  useEffect(() => {
    const cached = peekNewsArticles({
      category,
      lang: 'hi',
      city: location.city,
      state: location.region,
      limit: 24,
    });
    if (cached?.articles.length) {
      setArticles(cached.articles);
      setLoading(false);
    } else {
      setLoading(true);
    }
    void load(false);
  }, [load, category, location.city, location.region]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const openArticle = (article: NewsArticle) => {
    openNewsArticle(router, article);
  };

  const featured = articles[0];
  const rest = useMemo(() => articles.slice(1), [articles]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="News"
          variant="bar"
          onBack={() => backToMore(router)}
        />

        <View style={styles.filterBar}>
          {CATEGORIES.map((item) => {
            const active = item.id === category;
            return (
              <Pressable
                key={item.id}
                onPress={() => setCategory(item.id)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={rest}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListHeaderComponent={
              featured ? (
                <Pressable
                  style={({ pressed }) => [styles.featured, pressed && styles.pressed]}
                  onPress={() => openArticle(featured)}
                >
                  <NewsListThumb
                    article={featured}
                    category={category}
                    style={styles.featuredImage}
                    iconSize={34}
                    showLabel
                  />
                  <LinearGradient
                    colors={[...gradients.cardOverlay]}
                    style={styles.featuredOverlay}
                  >
                    <Text style={styles.featuredEyebrow} numberOfLines={1}>
                      {String(featured.source || '')}
                      {featured.date ? `  ·  ${String(featured.date)}` : ''}
                    </Text>
                    <Text style={styles.featuredTitle} numberOfLines={3}>
                      {String(featured.title || 'News')}
                    </Text>
                    {featured.excerpt ? (
                      <Text style={styles.featuredExcerpt} numberOfLines={2}>
                        {String(featured.excerpt)}
                      </Text>
                    ) : null}
                  </LinearGradient>
                </Pressable>
              ) : null
            }
            ListEmptyComponent={
              !featured ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No stories yet</Text>
                  <Text style={styles.empty}>
                    {error || 'Pull to refresh, or try another section.'}
                  </Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => openArticle(item)}
              >
                <NewsListThumb
                  article={item}
                  category={category}
                  style={styles.thumb}
                  iconSize={18}
                />
                <View style={styles.rowCopy}>
                  <Text style={styles.rowMeta} numberOfLines={1}>
                    {String(item.source || '')}
                    {item.date ? `  ·  ${String(item.date)}` : ''}
                  </Text>
                  <Text style={styles.rowTitle} numberOfLines={3}>
                    {String(item.title || 'News')}
                  </Text>
                </View>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors, gradients) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, paddingTop: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  filterText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  filterTextActive: {
    color: colors.onDark,
  },

  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 40,
  },

  featured: {
    height: 236,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    backgroundColor: colors.night,
  },
  featuredImage: {
    ...StyleSheet.absoluteFill,
  },
  featuredOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  featuredEyebrow: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 6,
  },
  featuredTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.onDark,
  },
  featuredExcerpt: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.82)',
  },

  row: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
    paddingRight: 4,
  },
  rowMeta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    letterSpacing: 0.2,
    color: colors.textSoft,
  },
  rowTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    lineHeight: 21,
    letterSpacing: -0.2,
    color: colors.heading,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  thumbFallback: {
    backgroundColor: colors.muted,
  },
  sep: {
    height: 10,
  },
  pressed: { opacity: 0.88 },

  emptyBox: {
    marginTop: 48,
    padding: 24,
    borderRadius: 16,
    backgroundColor: colors.canvasDeep,
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.heading,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
  },
}));
