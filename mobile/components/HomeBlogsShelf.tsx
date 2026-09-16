import { Image } from 'expo-image';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BlogPost } from '../lib/blogs';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  blogs: BlogPost[];
  loading?: boolean;
  error?: string;
  onSeeAll: () => void;
  onRetry?: () => void;
  onOpenBlog: (blog: BlogPost) => void;
};

/** Homepage FinderB Blog shelf — guides and local insights. */
export function HomeBlogsShelf({
  blogs,
  loading,
  error,
  onSeeAll,
  onRetry,
  onOpenBlog,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const visible = blogs.slice(0, 4);

  return (
    <View style={styles.shelf}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Text style={styles.title}>FinderB Blog</Text>
          <Text style={styles.subtitle}>
            Guides, tips, and local insights
          </Text>
        </View>
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brand} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Loading articles…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.stateBox}>
          <Ionicons name="book-outline" size={20} color={colors.textSoft} />
          <Text style={styles.stateTitle}>No blogs yet</Text>
          <Text style={styles.stateText}>
            {error || 'New articles from the FinderB team will appear here.'}
          </Text>
          {onRetry ? (
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <View style={styles.list}>
          {visible.map((blog) => (
            <Pressable
              key={blog.id}
              onPress={() => onOpenBlog(blog)}
              style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={blog.title}
            >
              <Image
                source={{ uri: blog.image }}
                style={styles.thumb}
                contentFit="cover"
                transition={160}
              />
              <View style={styles.copy}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Blog</Text>
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {blog.title}
                </Text>
                {blog.excerpt ? (
                  <Text style={styles.excerpt} numberOfLines={2}>
                    {blog.excerpt}
                  </Text>
                ) : null}
                <Text style={styles.meta} numberOfLines={1}>
                  {blog.date}
                  {blog.author ? ` · ${blog.author}` : ''}
                </Text>
              </View>
            </Pressable>
          ))}

          <Pressable
            onPress={onSeeAll}
            style={({ pressed }) => [styles.allBtn, pressed && styles.pressed]}
          >
            <Text style={styles.allBtnText}>Read all articles</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.brand} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  shelf: {
    marginBottom: 10,
    paddingTop: 8,
    backgroundColor: colors.canvas,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
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
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 2,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
  },
  list: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 92,
    height: 96,
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
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.brandSoft,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 9,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.brand,
  },
  cardTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: -0.15,
    color: colors.heading,
  },
  excerpt: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
    marginTop: 2,
  },
  allBtn: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  allBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
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
