import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { NewsArticle } from '../lib/news';
import {
  HOME_NEWS_LIMIT,
  NEWS_CATEGORIES,
  isUsableNewsImage,
  newsCategoryLabel,
  type NewsCategorySlug,
  type NewsLanguage,
} from '../constants/newsCategories';
import { fonts } from '../constants/typography';
import { NewsImagePlaceholder } from './NewsImagePlaceholder';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

function NewsCover({
  article,
  category,
  style,
}: {
  article: NewsArticle;
  category: NewsCategorySlug;
  style?: object;
}) {
  const styles = useStyles();
  const slug = (article.categorySlug || category || 'local') as NewsCategorySlug;
  const sourceUri = isUsableNewsImage(article.image) ? article.image!.trim() : null;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [sourceUri, article.link, article.id]);

  const showImage = Boolean(sourceUri) && !failed;

  return (
    <View style={[styles.cover, style]}>
      {showImage ? (
        <Image
          source={{ uri: sourceUri! }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={180}
          onError={() => setFailed(true)}
        />
      ) : (
        <NewsImagePlaceholder categorySlug={slug} style={StyleSheet.absoluteFill} />
      )}
    </View>
  );
}

type Props = {
  articles: NewsArticle[];
  loading?: boolean;
  error?: string;
  category: NewsCategorySlug;
  language: NewsLanguage;
  onCategoryChange: (slug: NewsCategorySlug) => void;
  onLanguageChange: (lang: NewsLanguage) => void;
  onSeeAll: () => void;
  onRetry?: () => void;
  onOpenArticle: (article: NewsArticle) => void;
};

/** Homepage news — hero story + swipeable story cards. */
export function HomeNewsShelf({
  articles,
  loading,
  error,
  category,
  language,
  onCategoryChange,
  onLanguageChange,
  onSeeAll,
  onRetry,
  onOpenArticle,
}: Props) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  const limited = articles.slice(0, HOME_NEWS_LIMIT);
  const featured = limited[0];
  const rest = limited.slice(1);
  const railCardW = Math.min(180, Math.round(windowWidth * 0.5));

  return (
    <View style={styles.shelf}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Text style={styles.title}>Latest News</Text>
        </View>
        <View style={styles.headRight}>
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => onLanguageChange('hi')}
              style={[styles.langBtn, language === 'hi' && styles.langBtnOn]}
            >
              <Text
                style={[styles.langText, language === 'hi' && styles.langTextOn]}
              >
                हिंदी
              </Text>
            </Pressable>
            <Pressable
              onPress={() => onLanguageChange('en')}
              style={[styles.langBtn, language === 'en' && styles.langBtnOn]}
            >
              <Text
                style={[styles.langText, language === 'en' && styles.langTextOn]}
              >
                EN
              </Text>
            </Pressable>
          </View>
          <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAllBtn}>
            <Text style={styles.more}>View all</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.brand} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        nestedScrollEnabled
      >
        {NEWS_CATEGORIES.map((cat) => {
          const active = cat.slug === category;
          return (
            <Pressable
              key={cat.slug}
              onPress={() => onCategoryChange(cat.slug)}
              style={[styles.chip, active && styles.chipOn]}
            >
              <Ionicons
                name={cat.icon}
                size={12}
                color={active ? colors.white : colors.textMuted}
              />
              <Text style={[styles.chipText, active && styles.chipTextOn]}>
                {newsCategoryLabel(cat.slug, language)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Loading headlines…</Text>
        </View>
      ) : limited.length === 0 ? (
        <View style={styles.stateBox}>
          <Ionicons name="newspaper-outline" size={22} color={colors.textSoft} />
          <Text style={styles.stateTitle}>No news right now</Text>
          <Text style={styles.stateText}>
            {error || 'Pull to refresh or try again in a moment.'}
          </Text>
          {onRetry ? (
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.body}>
          {featured ? (
            <Pressable
              onPress={() => onOpenArticle(featured)}
              style={({ pressed }) => [
                styles.heroCard,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={String(featured.title || 'Top story')}
            >
              <NewsCover article={featured} category={category} />
              <LinearGradient
                colors={[...gradients.cardOverlay]}
                style={styles.heroScrim}
              />
              <View style={styles.heroBody}>
                <View style={styles.heroBadges}>
                  <View style={styles.topStoryPill}>
                    <Ionicons name="flash" size={11} color={colors.accentDeep} />
                    <Text style={styles.topStoryText}>
                      {language === 'hi' ? 'टॉप स्टोरी' : 'Top story'}
                    </Text>
                  </View>
                  {featured.category ? (
                    <View style={styles.catGlass}>
                      <Text style={styles.catGlassText} numberOfLines={1}>
                        {String(featured.category)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                    <Text style={styles.heroHeadline} numberOfLines={2}>
                      {String(featured.title || 'News')}
                    </Text>
                <View style={styles.heroMeta}>
                  {featured.source ? (
                    <Text style={styles.heroSource} numberOfLines={1}>
                      {String(featured.source)}
                    </Text>
                  ) : null}
                  {featured.date ? (
                    <Text style={styles.heroDate} numberOfLines={1}>
                      {String(featured.date)}
                    </Text>
                  ) : null}
                  <View style={styles.readPill}>
                    <Text style={styles.readPillText}>Read</Text>
                    <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                  </View>
                </View>
              </View>
            </Pressable>
          ) : null}

          {rest.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
              decelerationRate="fast"
              nestedScrollEnabled
              snapToInterval={railCardW + 12}
              snapToAlignment="start"
              disableIntervalMomentum
            >
              {rest.map((article, index) => (
                <Pressable
                  key={article.id || article.link || article.title}
                  onPress={() => onOpenArticle(article)}
                  style={({ pressed }) => [
                    styles.storyCard,
                    { width: railCardW },
                    pressed && styles.pressed,
                  ]}
                >
                  <NewsCover
                    article={article}
                    category={category}
                    style={styles.storyCover}
                  />
                  <LinearGradient
                    colors={[...gradients.cardOverlay]}
                    style={styles.storyScrim}
                  />
                  <View style={styles.storyIndex}>
                    <Text style={styles.storyIndexText}>{index + 2}</Text>
                  </View>
                  <View style={styles.storyBody}>
                    {article.source ? (
                      <Text style={styles.storySource} numberOfLines={1}>
                        {String(article.source)}
                      </Text>
                    ) : null}
                    <Text style={styles.storyHeadline} numberOfLines={2}>
                      {String(article.title || 'News')}
                    </Text>
                  </View>
                </Pressable>
              ))}

              <Pressable
                onPress={onSeeAll}
                style={({ pressed }) => [
                  styles.moreCard,
                  { width: Math.min(140, railCardW * 0.7) },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.moreIcon}>
                  <Ionicons name="newspaper-outline" size={22} color={colors.brand} />
                </View>
                <Text style={styles.moreTitle}>More headlines</Text>
                <Text style={styles.moreSub}>Browse all topics</Text>
              </Pressable>
            </ScrollView>
          ) : null}
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  shelf: {
    marginBottom: 6,
    paddingTop: 6,
    backgroundColor: colors.canvas,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 10,
  },
  headLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.35,
    color: colors.heading,
  },
  headRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  langToggle: {
    flexDirection: 'row',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    padding: 2,
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  langBtnOn: {
    backgroundColor: colors.brand,
  },
  langText: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: colors.textMuted,
  },
  langTextOn: {
    color: colors.onDark,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  more: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
  },
  chips: {
    paddingHorizontal: 16,
    gap: 6,
    paddingBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  chipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.textMuted,
  },
  chipTextOn: {
    color: colors.onDark,
  },
  body: {
    gap: 10,
    paddingBottom: 4,
  },
  heroCard: {
    marginHorizontal: 16,
    height: 172,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  cover: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.muted,
  },
  heroScrim: {
    ...StyleSheet.absoluteFill,
  },
  heroBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 36,
    gap: 6,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  topStoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: colors.secondary,
  },
  topStoryText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.2,
    color: colors.accentDeep,
  },
  catGlass: {
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  catGlassText: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.92)',
    maxWidth: 110,
  },
  heroHeadline: {
    fontFamily: fonts.extraBold,
    fontSize: 16,
    lineHeight: 21,
    letterSpacing: -0.25,
    color: '#FFFFFF',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  heroSource: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: 'rgba(255,255,255,0.88)',
    maxWidth: 120,
  },
  heroDate: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: 'rgba(255,255,255,0.62)',
  },
  readPill: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  readPillText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  rail: {
    paddingHorizontal: 16,
    gap: 10,
  },
  storyCard: {
    height: 148,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  storyCover: {
    ...StyleSheet.absoluteFill,
  },
  storyScrim: {
    ...StyleSheet.absoluteFill,
  },
  storyIndex: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(12,10,9,0.55)',
  },
  storyIndexText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#FFFFFF',
  },
  storyBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 10,
    gap: 3,
  },
  storySource: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: 'rgba(255,255,255,0.72)',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  storyHeadline: {
    fontFamily: fonts.bold,
    fontSize: 13,
    lineHeight: 17,
    letterSpacing: -0.1,
    color: '#FFFFFF',
  },
  moreCard: {
    height: 148,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    gap: 6,
  },
  moreIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  moreTitle: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.heading,
    textAlign: 'center',
  },
  moreSub: {
    fontFamily: fonts.regular,
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
  },
  pressed: { opacity: 0.94 },
  stateBox: {
    marginHorizontal: 16,
    paddingVertical: 22,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    gap: 6,
  },
  stateTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  stateText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 2,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  retryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.onDark,
  },
}));
