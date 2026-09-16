import { Href, useFocusEffect, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../components/ScreenHeader';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { useTabScrollPadding } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import {
  listBookmarkedBlogs,
  type BlogBookmarkMeta,
} from '../lib/blogEngagement';

export default function SavedBlogsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const pad = useTabScrollPadding(28);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<BlogBookmarkMeta[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listBookmarkedBlogs();
    setItems(list);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Saved blogs" variant="bar" />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : items.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="bookmark-outline" size={36} color={colors.textSoft} />
            <Text style={styles.emptyTitle}>No saved blogs yet</Text>
            <Text style={styles.emptyText}>
              Tap Save on any article to keep it here for later.
            </Text>
            <Pressable
              style={styles.cta}
              onPress={() => router.push('/(tabs)/blog' as Href)}
            >
              <Text style={styles.ctaText}>Browse blogs</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: pad }]}
            showsVerticalScrollIndicator={false}
          >
            {items.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() =>
                  router.push(
                    `/(tabs)/blog/${encodeURIComponent(item.slug || item.id)}` as Href,
                  )
                }
              >
                {item.image ? (
                  <Image
                    source={{ uri: item.image }}
                    style={styles.thumb}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]}>
                    <Ionicons name="newspaper-outline" size={22} color={colors.textSoft} />
                  </View>
                )}
                <View style={styles.copy}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.meta}>Saved for you</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
              </Pressable>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas, paddingTop: 8 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 8,
  },
  emptyTitle: {
    marginTop: 8,
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.heading,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSoft,
    textAlign: 'center',
  },
  cta: {
    marginTop: 12,
    backgroundColor: colors.ink,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  thumbFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.heading,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  pressed: { opacity: 0.92 },
}));
