import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { submitBusinessReview } from '../lib/reviewsApi';
import type { MerchantReview } from '../lib/merchants';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  businessId: string;
  alreadyReviewed: boolean;
  signedIn: boolean;
  onRequestLogin: () => void;
  onSubmitted: (payload: { reviews: MerchantReview[]; rating: number }) => void;
};

export function MerchantReviewComposer({
  businessId,
  alreadyReviewed,
  signedIn,
  onRequestLogin,
  onSubmitted,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!signedIn) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Write a review</Text>
        <Text style={styles.sub}>
          Sign in with your FinderB account to rate this business.
        </Text>
        <Pressable style={styles.loginBtn} onPress={onRequestLogin}>
          <Text style={styles.loginBtnText}>Sign in to review</Text>
        </Pressable>
      </View>
    );
  }

  if (alreadyReviewed) {
    return (
      <View style={styles.card}>
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.doneText}>You have already reviewed this business.</Text>
        </View>
      </View>
    );
  }

  const onSubmit = async () => {
    setError('');
    setSuccess('');
    if (rating < 1) {
      setError('Please select a rating');
      return;
    }
    if (content.trim().length < 10) {
      setError('Please write at least 10 characters');
      return;
    }

    setSubmitting(true);
    const result = await submitBusinessReview({
      businessId,
      rating,
      content,
    });
    setSubmitting(false);

    if (!result.success) {
      if (result.unauthorized) {
        onRequestLogin();
        return;
      }
      setError(result.error);
      return;
    }

    setSuccess('Thanks — your review is live.');
    setContent('');
    setRating(0);
    onSubmitted({ reviews: result.reviews, rating: result.rating });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Write a review</Text>
      <Text style={styles.sub}>Share your experience to help others decide.</Text>

      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}
          >
            <Ionicons
              name={n <= rating ? 'star' : 'star-outline'}
              size={28}
              color={colors.star}
            />
          </Pressable>
        ))}
      </View>

      <TextInput
        value={content}
        onChangeText={setContent}
        placeholder="What stood out? Be specific and helpful…"
        placeholderTextColor={colors.textSoft}
        multiline
        textAlignVertical="top"
        style={styles.input}
        maxLength={1200}
        editable={!submitting}
      />
      <Text style={styles.counter}>{content.trim().length}/1200</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}

      <Pressable
        style={[styles.submitBtn, submitting && styles.submitDisabled]}
        onPress={() => void onSubmit()}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.submitText}>Post review</Text>
        )}
      </Pressable>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    gap: 8,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.heading,
  },
  sub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 2,
  },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    backgroundColor: colors.surfaceSoft,
  },
  counter: {
    alignSelf: 'flex-end',
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
  },
  success: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.success,
  },
  submitBtn: {
    marginTop: 4,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  loginBtn: {
    marginTop: 4,
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  loginBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doneText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
}));
