import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../components/ScreenHeader';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { fetchMerchantBySlugOrId } from '../../lib/api';
import {
  PUBLIC_REVIEW_PAGE,
  reviewsNewestFirst,
  type Merchant,
  type MerchantReview,
} from '../../lib/merchants';
import { reportBusinessReview } from '../../lib/reviewsApi';

function Stars({ rating }: { rating: number }) {
  const { colors } = useTheme();
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: 5 }, (_, index) => (
        <Ionicons
          key={index}
          name={index < full ? 'star' : 'star-outline'}
          size={12}
          color={colors.star}
        />
      ))}
    </View>
  );
}

export default function BusinessReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const styles = useStyles();
  const { user } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shown, setShown] = useState(PUBLIC_REVIEW_PAGE);
  const [reportedReviewIds, setReportedReviewIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const key = typeof id === 'string' ? id.trim() : '';
    if (!key) {
      setLoading(false);
      setError('This business could not be found.');
      return;
    }
    let cancelled = false;
    setLoading(true);
    void fetchMerchantBySlugOrId(key).then((result) => {
      if (cancelled) return;
      setMerchant(result.merchant);
      setError(result.merchant ? '' : result.error || 'This business could not be found.');
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const reviews = useMemo(
    () => reviewsNewestFirst(merchant?.reviews ?? []),
    [merchant?.reviews],
  );
  const visible = reviews.slice(0, shown);

  const sendReviewReport = async (reviewId: string, reason: string) => {
    if (!merchant) return;
    const result = await reportBusinessReview({ businessId: merchant.id, reviewId, reason });
    if (!result.success) {
      if (result.unauthorized) requestLogin();
      else Alert.alert('Could not report', result.error);
      return;
    }
    setReportedReviewIds((prev) => new Set(prev).add(reviewId));
    Alert.alert('Thanks for reporting', 'Our team will review it and remove it if it breaks our rules.');
  };

  const handleReportReview = (reviewId: string) => {
    if (!user) {
      requestLogin();
      return;
    }
    Alert.alert('Report this review?', 'Tell us what is wrong with it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam or fake', onPress: () => void sendReviewReport(reviewId, 'Spam or fake review') },
      {
        text: 'Abusive or offensive',
        style: 'destructive',
        onPress: () => void sendReviewReport(reviewId, 'Abusive or offensive content'),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Reviews" subtitle={merchant?.name} />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : error || !merchant ? (
        <Text style={styles.empty}>{error || 'This business could not be found.'}</Text>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.count}>
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </Text>
          {visible.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              flagged={reportedReviewIds.has(review.id)}
              ownReview={Boolean(review.userId && review.userId === user?.id)}
              onFlag={() => handleReportReview(review.id)}
            />
          ))}
          {shown < reviews.length ? (
            <Pressable
              onPress={() => setShown((count) => count + PUBLIC_REVIEW_PAGE)}
              style={styles.loadMore}
              accessibilityRole="button"
              accessibilityLabel="Load more reviews"
            >
              <Text style={styles.loadMoreText}>Load more</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ReviewCard({
  review,
  flagged,
  ownReview,
  onFlag,
}: {
  review: MerchantReview;
  flagged: boolean;
  ownReview: boolean;
  onFlag: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(review.author || 'A').slice(0, 1).toUpperCase()}</Text>
        </View>
        <View style={styles.head}>
          <View style={styles.authorRow}>
            <Text style={styles.author}>{review.author}</Text>
            {review.authorVerified && !review.anonymous ? (
              <Ionicons name="checkmark-circle" size={15} color="#0284C7" />
            ) : null}
            {review.anonymous ? <Text style={styles.anon}>Anonymous</Text> : null}
          </View>
          <Stars rating={review.rating} />
          {review.date ? <Text style={styles.date}>{review.date}</Text> : null}
        </View>
        {ownReview ? null : flagged ? (
          <Text style={styles.flagged}>Flagged</Text>
        ) : (
          <Pressable
            onPress={onFlag}
            hitSlop={8}
            style={styles.flag}
            accessibilityRole="button"
            accessibilityLabel={`Flag review by ${review.author || 'customer'}`}
          >
            <Ionicons name="flag-outline" size={13} color={colors.textSoft} />
            <Text style={styles.flagText}>Flag</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.body}>{review.content}</Text>
      {review.merchantReply?.content ? (
        <View style={styles.reply}>
          <Text style={styles.replyLabel}>Owner reply</Text>
          <Text style={styles.replyBody}>{review.merchantReply.content}</Text>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  screen: { flex: 1, backgroundColor: colors.canvas },
  loader: { marginTop: 40 },
  empty: {
    margin: 20,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  content: { padding: 16, gap: 10, paddingBottom: 32 },
  count: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSoft,
    marginBottom: 4,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.surface,
    borderWidth: 0.5,
    borderColor: colors.border,
    gap: 8,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  avatarText: { fontFamily: fonts.bold, fontSize: 14, color: colors.brand },
  head: { flex: 1, minWidth: 0, gap: 3 },
  authorRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  author: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
  anon: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textMuted,
    backgroundColor: colors.surfaceSoft,
    overflow: 'hidden',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  date: { fontFamily: fonts.medium, fontSize: 10, color: colors.textSoft },
  body: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  flagText: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSoft },
  flagged: { fontFamily: fonts.medium, fontSize: 11, color: colors.textSoft },
  reply: {
    marginTop: 2,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    gap: 4,
  },
  replyLabel: { fontFamily: fonts.semiBold, fontSize: 11, color: colors.ink },
  replyBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  loadMore: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    marginTop: 4,
  },
  loadMoreText: { fontFamily: fonts.semiBold, fontSize: 14, color: colors.ink },
}));
