import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
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
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import { fetchBlogs, type BlogPost } from '../../../lib/blogs';
import { backToMore } from '../../../lib/navigation';

export default function BlogListScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const bottomPad = useTabScrollPadding(24);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await fetchBlogs(24);
    setBlogs(result.blogs);
    setError(result.error || '');
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openBlog = (blog: BlogPost) => {
    router.push(`/(tabs)/blog/${blog.slug || blog.id}` as Href);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Blogs"
          variant="bar"
          onBack={() => backToMore(router)}
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[
              styles.list,
              { paddingBottom: bottomPad },
              blogs.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No articles yet</Text>
                <Text style={styles.emptyText}>
                  {error || 'Check back soon for new FinderB stories.'}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openBlog(item)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.copy}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.excerpt ? (
                    <Text style={styles.excerpt} numberOfLines={2}>
                      {item.excerpt}
                    </Text>
                  ) : null}
                  <Text style={styles.meta} numberOfLines={1}>
                    {item.date}
                    {item.author ? ` · ${item.author}` : ''}
                  </Text>
                </View>
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, paddingTop: 8 },
  list: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listEmpty: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
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
  card: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 96,
    height: 104,
    backgroundColor: colors.muted,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
    justifyContent: 'center',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.heading,
  },
  excerpt: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
    marginTop: 2,
  },
  pressed: { opacity: 0.94 },
}));
