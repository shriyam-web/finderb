import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchNewsArticleDetail,
  type NewsArticleDetail,
} from '../../../lib/news';
import {
  decodeGoogleNewsUrlOffline,
  isGoogleNewsArticleUrl,
} from '../../../lib/googleNewsUrl';
import { getStashedNewsArticle } from '../../../lib/newsArticleStore';

function param(value: string | string[] | undefined): string {
  return typeof value === 'string' ? value : '';
}

function wrapArticleHtml(
  html: string,
  opts: { isDark: boolean; title: string },
): string {
  const fg = opts.isDark ? '#F5F5F4' : '#1C1917';
  const muted = opts.isDark ? '#A8A29E' : '#57534E';
  const bg = opts.isDark ? '#1F1C1A' : '#FAFAF9';
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
<style>
  html, body { margin: 0; padding: 0; background: ${bg}; color: ${fg};
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 17px; line-height: 1.6; }
  body { padding: 4px 2px 28px; }
  p, li { margin: 0 0 14px; }
  h1,h2,h3 { line-height: 1.3; margin: 18px 0 10px; }
  img { max-width: 100%; height: auto; border-radius: 12px; margin: 8px 0 14px; }
  a { color: ${opts.isDark ? '#5EEAD4' : '#0F766E'}; text-decoration: none; }
  figure { margin: 0 0 14px; }
  figcaption { color: ${muted}; font-size: 13px; margin-top: 6px; }
</style>
</head>
<body>${html || `<p>${opts.title}</p>`}</body>
</html>`;
}

/**
 * In-app news reader — extract article body and show it inside FinderB.
 * External browser is optional, not required to read the story.
 */
export default function NewsArticleScreen() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{
    id?: string;
    url?: string;
    title?: string;
    excerpt?: string;
    source?: string;
    date?: string;
    category?: string;
    image?: string;
  }>();
  const bottomPad = useTabScrollPadding(12);
  const stashed = getStashedNewsArticle(param(params.id));

  const seedUrl = stashed?.link || param(params.url);
  const seedTitle = stashed?.title || param(params.title) || 'Story';
  const seedExcerpt = stashed?.excerpt || param(params.excerpt);
  const seedSource = stashed?.source || param(params.source);
  const seedDate = stashed?.date || param(params.date);
  const seedCategory = stashed?.category || param(params.category);
  const seedImage = stashed?.image || param(params.image);

  const [article, setArticle] = useState<NewsArticleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [webHeight, setWebHeight] = useState(420);

  useEffect(() => {
    let cancelled = false;
    if (!seedUrl) {
      setLoading(false);
      setError('This story link is missing.');
      return;
    }

    (async () => {
      setLoading(true);
      setError('');
      const resolvedUrl =
        (isGoogleNewsArticleUrl(seedUrl)
          ? decodeGoogleNewsUrlOffline(seedUrl)
          : null) || seedUrl;

      const result = await fetchNewsArticleDetail({
        url: resolvedUrl,
        title: seedTitle,
        excerpt: seedExcerpt,
        image: seedImage,
        source: seedSource,
        date: seedDate,
        category: seedCategory,
      });

      if (cancelled) return;

      if (result.article?.contentHtml) {
        setArticle(result.article);
        setLoading(false);
        return;
      }

      setArticle(
        result.article || {
          title: seedTitle,
          excerpt: seedExcerpt || seedTitle,
          contentHtml: `<p>${seedExcerpt || seedTitle}</p>`,
          image: seedImage || null,
          source: seedSource || 'News',
          date: seedDate || '',
          category: seedCategory || 'News',
          sourceUrl: resolvedUrl,
          hasFullContent: false,
        },
      );
      setError(result.error || '');
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    seedCategory,
    seedDate,
    seedExcerpt,
    seedImage,
    seedSource,
    seedTitle,
    seedUrl,
  ]);

  const htmlDoc = useMemo(() => {
    if (!article) return '';
    return wrapArticleHtml(article.contentHtml, {
      isDark,
      title: article.title || seedTitle,
    });
  }, [article, isDark, seedTitle]);

  const openExternal = async () => {
    const href = article?.sourceUrl || seedUrl;
    if (!href) return;
    await WebBrowser.openBrowserAsync(href, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  };

  if (!seedUrl) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader
            title="Story"
            onBack={() => router.replace('/(tabs)/news')}
          />
          <View style={styles.center}>
            <Text style={styles.error}>This story link is missing.</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader
            title="Story"
            onBack={() => router.replace('/(tabs)/news')}
          />
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: bottomPad }}>
            <Text style={styles.readerTitle}>{article?.title || seedTitle}</Text>
            <Text style={styles.meta}>
              {[article?.source || seedSource, article?.date || seedDate]
                .filter(Boolean)
                .join('  ·  ')}
            </Text>
            <Text style={styles.webFallbackBody}>
              {article?.excerpt || seedExcerpt || 'Open the story to continue reading.'}
            </Text>
            <Pressable style={styles.sourceBtn} onPress={() => void openExternal()}>
              <Text style={styles.sourceBtnText}>Open full story</Text>
              <Ionicons name="open-outline" size={16} color={colors.onDark} />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Story"
          onBack={() => router.replace('/(tabs)/news')}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Loading story…</Text>
          </View>
        ) : (
          <>
            <ScrollView
              contentContainerStyle={{ paddingBottom: Math.max(bottomPad, 16) }}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.readerMeta}>
                <Text style={styles.meta} numberOfLines={1}>
                  {[article?.source || seedSource || 'News', article?.date || seedDate, article?.category || seedCategory]
                    .filter(Boolean)
                    .map((v) => String(v))
                    .join('  ·  ')}
                </Text>
                <Text style={styles.readerTitle}>
                  {article?.title || seedTitle}
                </Text>
              </View>

              {(article?.image || seedImage) ? (
                <Image
                  source={{ uri: (article?.image || seedImage)! }}
                  style={[styles.hero, { width: width - 32 }]}
                  contentFit="cover"
                />
              ) : null}

              {error && !article?.hasFullContent ? (
                <Text style={styles.notice}>
                  Showing the available preview. You can keep reading here.
                </Text>
              ) : null}

              <View style={[styles.webWrap, { height: Math.max(webHeight, 280) }]}>
                <WebView
                  originWhitelist={['*']}
                  source={{ html: htmlDoc, baseUrl: article?.sourceUrl || seedUrl }}
                  style={styles.web}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  setSupportMultipleWindows={false}
                  onMessage={(event) => {
                    const next = Number(event.nativeEvent.data);
                    if (Number.isFinite(next) && next > 120) {
                      setWebHeight(next + 24);
                    }
                  }}
                  injectedJavaScript={`
                    (function() {
                      function send() {
                        var h = Math.max(
                          document.body.scrollHeight,
                          document.documentElement.scrollHeight
                        );
                        window.ReactNativeWebView.postMessage(String(h));
                      }
                      send();
                      setTimeout(send, 250);
                      setTimeout(send, 800);
                      true;
                    })();
                  `}
                />
              </View>
            </ScrollView>

            <View style={[styles.readerFooter, { paddingBottom: Math.max(bottomPad - 36, 8) }]}>
              <Pressable style={styles.sourceBtnGhost} onPress={() => void openExternal()}>
                <Text style={styles.sourceBtnGhostText}>View original source</Text>
                <Ionicons name="open-outline" size={15} color={colors.textMuted} />
              </Pressable>
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  error: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  readerMeta: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 8,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  readerTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.3,
    color: colors.heading,
  },
  hero: {
    alignSelf: 'center',
    height: 200,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: colors.muted,
  },
  notice: {
    marginHorizontal: 16,
    marginBottom: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  webWrap: {
    marginHorizontal: 12,
    overflow: 'hidden',
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  webFallbackBody: {
    marginTop: 12,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
  },
  readerFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sourceBtn: {
    marginTop: 8,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: colors.ink,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },
  sourceBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  sourceBtnGhost: {
    minHeight: 40,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  sourceBtnGhostText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
}));
