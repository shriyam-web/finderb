import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BadgeInfoModal } from './BadgeInfoModal';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { LivingFire } from './LivingFire';

/** Same clock, color, and shine as the business profile. `scale` shrinks the home-card badge. */
export function ReplyPace({ label, scale = 1 }: { label: string; scale?: number }) {
  const { isDark } = useTheme();
  const replyBrown = isDark ? '#C4A484' : '#8A5A32';
  const tick = useRef(new Animated.Value(0)).current;
  const shine = useRef(new Animated.Value(0)).current;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const icon = Animated.loop(
      Animated.sequence([
        Animated.timing(tick, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(tick, { toValue: 0, duration: 700, useNativeDriver: true }),
      ]),
    );
    const gleam = Animated.loop(
      Animated.sequence([
        Animated.timing(shine, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.delay(1400),
      ]),
    );
    icon.start();
    gleam.start();
    return () => {
      icon.stop();
      gleam.stop();
    };
  }, [shine, tick]);

  const rotate = tick.interpolate({
    inputRange: [0, 1],
    outputRange: ['-12deg', '12deg'],
  });
  const iconScale = tick.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.16],
  });
  const translateX = shine.interpolate({
    inputRange: [0, 1],
    outputRange: [-36, 180],
  });

  return (
    <Pressable
      onPress={() => setOpen(true)}
      style={styles.responseChip}
      accessibilityRole="button"
      accessibilityLabel={`Usually replies in ${label}. How long this business usually takes to answer a new enquiry.`}
    >
      <BadgeInfoModal
        visible={open}
        title="Usually replies in"
        message="How long this business usually takes to answer a new enquiry."
        onClose={() => setOpen(false)}
      />
      <Animated.View style={{ transform: [{ rotate }, { scale: iconScale }] }}>
        <Ionicons name="time-outline" size={Math.max(11, Math.round(15 * 1.1 * scale))} color={replyBrown} />
      </Animated.View>
      <View style={styles.responseShineWrap}>
        <Text style={[styles.responseValue, { color: replyBrown, fontSize: 13 * 1.1 * scale }]}>
          Usually replies in {label}
        </Text>
        <Animated.View pointerEvents="none" style={[styles.responseShine, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.95)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Pressable>
  );
}

/** Same fire and label as the business profile. */
export function BestInCategoryMark() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <Pressable
      onPress={() => setOpen(true)}
      style={styles.trendingBadge}
      accessibilityRole="button"
      accessibilityLabel="Best in Category. One of the strongest listings in this category right now."
    >
      <BadgeInfoModal
        visible={open}
        title="Best in Category"
        message="One of the strongest listings in this category right now."
        onClose={() => setOpen(false)}
      />
      <LivingFire />
      <Text style={[styles.trendingText, { color: colors.textMuted }]}>Best in Category</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  trendingText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
  },
  responseChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '100%',
    backgroundColor: 'transparent',
  },
  responseShineWrap: {
    overflow: 'hidden',
    flexShrink: 1,
  },
  responseValue: {
    fontFamily: fonts.semiBold,
    fontSize: 14.3,
  },
  responseShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
  },
});
