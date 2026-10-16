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
import { REVIEW_STAR_EMOJI, reviewTemplatesForCategory } from '../lib/reviewInvite';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  businessId: string;
  category?: string;
  alreadyReviewed: boolean;
  signedIn: boolean;
  ownBusiness?: boolean;
  authorName?: string;
  onRequestLogin: () => void;
  onSubmitted: (payload: { reviews: MerchantReview[]; rating: number }) => void;
};

function maskName(name: string): string {
  const trimmed = name.trim() || 'Customer';
  return trimmed
    .split(/\s+/)
    .map((word) => {
      if (!word) return word;
      return word.length === 1 ? word : `${word[0]}${'x'.repeat(word.length - 1)}`;
    })
    .join(' ');
}

export function MerchantReviewComposer({
  businessId,
  category,
  alreadyReviewed,
  signedIn,
  ownBusiness,
  authorName,
  onRequestLogin,
  onSubmitted,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
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

  if (ownBusiness) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>Your listing</Text>
        <Text style={styles.sub}>You cannot review your own business.</Text>
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
      anonymous,
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

    setSuccess(anonymous ? 'Thanks — your anonymous review is live.' : 'Thanks — your review is live.');
    setContent('');
    setRating(0);
    setAnonymous(false);
    onSubmitted({ reviews: result.reviews, rating: result.rating });
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Write a review</Text>
      <Text style={styles.sub}>Share your experience to help others decide.</Text>

      <View style={styles.mood}>
        <Text style={styles.moodEmoji}>{REVIEW_STAR_EMOJI[rating]?.emoji || '⭐'}</Text>
        <Text style={styles.moodLabel}>{REVIEW_STAR_EMOJI[rating]?.label || 'How was it?'}</Text>
      </View>
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

      <View style={styles.templates}>
        {reviewTemplatesForCategory(category || '').slice(0, 4).map((template) => (
          <Pressable key={template} onPress={() => setContent(template)} style={styles.template}>
            <Text style={styles.templateText}>{template}</Text>
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

      <Pressable
        style={styles.checkRow}
        onPress={() => setAnonymous((value) => !value)}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: anonymous }}
      >
        <Ionicons
          name={anonymous ? 'checkbox' : 'square-outline'}
          size={20}
          color={anonymous ? colors.ink : colors.textMuted}
        />
        <View style={styles.flex}>
          <Text style={styles.checkTitle}>Post anonymously</Text>
          <Text style={styles.checkHint}>
            Your name will look like {maskName(authorName || 'Your name')} on this listing.
          </Text>
        </View>
      </Pressable>

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
  mood: { alignItems: 'center', gap: 4, marginTop: 4 },
  moodEmoji: { fontSize: 36, lineHeight: 42 },
  moodLabel: { fontFamily: fonts.medium, fontSize: 13, color: colors.textMuted },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 2,
  },
  templates: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  template: {
    maxWidth: '100%',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
  },
  templateText: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: colors.textMuted },
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
  flex: { flex: 1, minWidth: 0 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkTitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.heading,
  },
  checkHint: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
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
