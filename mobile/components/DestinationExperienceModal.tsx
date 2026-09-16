import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import {
  DESTINATION_VIBES,
  submitDestinationRating,
} from '../lib/destinationEngagement';

const MOODS = [
  { rating: 1, label: 'Meh', emoji: '😕' },
  { rating: 2, label: 'Okay', emoji: '🙂' },
  { rating: 3, label: 'Nice', emoji: '😊' },
  { rating: 4, label: 'Loved', emoji: '😍' },
  { rating: 5, label: 'Epic', emoji: '🤩' },
] as const;

type Props = {
  visible: boolean;
  placeId: string;
  placeName: string;
  userId: string;
  initialRating?: number | null;
  initialVibes?: string[];
  initialNote?: string;
  onClose: () => void;
  onSubmitted: () => void;
};

export function DestinationExperienceModal({
  visible,
  placeId,
  placeName,
  userId,
  initialRating,
  initialVibes,
  initialNote,
  onClose,
  onSubmitted,
}: Props) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(initialRating || 0);
  const [vibes, setVibes] = useState<string[]>(initialVibes || []);
  const [note, setNote] = useState(initialNote || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const rise = useRef(new Animated.Value(40)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    setRating(initialRating || 0);
    setVibes(initialVibes || []);
    setNote(initialNote || '');
    setError('');
    setDone(false);
    rise.setValue(40);
    Animated.spring(rise, {
      toValue: 0,
      friction: 8,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [visible, initialRating, initialVibes, initialNote, rise]);

  useEffect(() => {
    if (!visible || rating < 1) return;
    glow.setValue(0);
    Animated.timing(glow, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [glow, rating, visible]);

  const mood = useMemo(
    () => MOODS.find((item) => item.rating === rating) || null,
    [rating],
  );

  const toggleVibe = (id: string) => {
    setVibes((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id].slice(0, 4),
    );
  };

  const onSubmit = async () => {
    setError('');
    if (rating < 1) {
      setError('Pick how the place felt');
      return;
    }
    setSubmitting(true);
    const result = await submitDestinationRating({
      placeId,
      userId,
      rating,
      vibes,
      note,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error || 'Could not save your experience');
      return;
    }
    setDone(true);
    setTimeout(() => {
      onSubmitted();
      onClose();
    }, 900);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: Math.max(insets.bottom, 16) + 8,
              transform: [{ translateY: rise }],
            },
          ]}
        >
          <LinearGradient
            colors={[...gradients.hero]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.handle} />
            <Text style={styles.eyebrow}>Rate your experience</Text>
            <Text style={styles.title} numberOfLines={2}>
              {placeName}
            </Text>
            <Text style={styles.sub}>
              Capture the vibe — not just a star score.
            </Text>
          </LinearGradient>

          {done ? (
            <View style={styles.doneBox}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={styles.doneTitle}>Thanks for sharing</Text>
              <Text style={styles.doneSub}>
                Your visit note helps other explorers.
              </Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>How did it feel?</Text>
              <View style={styles.moodRow}>
                {MOODS.map((item) => {
                  const on = rating === item.rating;
                  return (
                    <Pressable
                      key={item.rating}
                      onPress={() => setRating(item.rating)}
                      style={[styles.moodCard, on && styles.moodCardOn]}
                    >
                      <Animated.Text
                        style={[
                          styles.moodEmoji,
                          on && {
                            transform: [
                              {
                                scale: glow.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [1, 1.18],
                                }),
                              },
                            ],
                          },
                        ]}
                      >
                        {item.emoji}
                      </Animated.Text>
                      <Text style={[styles.moodLabel, on && styles.moodLabelOn]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {mood ? (
                <Text style={styles.moodHint}>
                  You chose “{mood.label}” — nice pick.
                </Text>
              ) : null}

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                What matched the place? (up to 4)
              </Text>
              <View style={styles.vibeWrap}>
                {DESTINATION_VIBES.map((vibe) => {
                  const on = vibes.includes(vibe.id);
                  return (
                    <Pressable
                      key={vibe.id}
                      onPress={() => toggleVibe(vibe.id)}
                      style={[styles.vibeChip, on && styles.vibeChipOn]}
                    >
                      <Text style={styles.vibeEmoji}>{vibe.emoji}</Text>
                      <Text style={[styles.vibeText, on && styles.vibeTextOn]}>
                        {vibe.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                One line for fellow travellers
              </Text>
              <TextInput
                style={styles.note}
                value={note}
                onChangeText={setNote}
                placeholder="e.g. Go early for soft light and fewer crowds"
                placeholderTextColor={colors.textSoft}
                multiline
                maxLength={180}
                textAlignVertical="top"
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Not now</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, submitting && styles.submitDisabled]}
                  onPress={() => void onSubmit()}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color={colors.onDark} />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={16} color={colors.secondary} />
                      <Text style={styles.submitText}>Save experience</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlay,
  },
  sheet: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  hero: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.35)',
    marginBottom: 14,
  },
  eyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.secondary,
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color:
      colors.statusBarStyle === 'light' ? colors.primary : colors.onDark,
  },
  sub: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.72)',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 10,
  },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  sectionSpaced: {
    marginTop: 8,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  moodCard: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  moodCardOn: {
    backgroundColor: colors.canvasWarm,
    borderColor: colors.secondary,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color: colors.textSoft,
  },
  moodLabelOn: {
    color: colors.heading,
    fontFamily: fonts.semiBold,
  },
  moodHint: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.open,
  },
  vibeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  vibeChipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  vibeEmoji: {
    fontSize: 13,
  },
  vibeText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  vibeTextOn: {
    color: colors.onDark,
  },
  note: {
    minHeight: 78,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 12 : 10,
    paddingBottom: 10,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  submitBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.brand,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  doneBox: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
    gap: 8,
  },
  doneEmoji: { fontSize: 40 },
  doneTitle: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.heading,
  },
  doneSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
}));
