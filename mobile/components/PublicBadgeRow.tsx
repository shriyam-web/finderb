import { Fragment, useEffect, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';

export type PublicBadge = {
  id: 'quickReply' | 'highlyRated' | 'popularMonth' | 'newOnFinderB' | 'trusted';
  label: string;
};

const HINT: Record<PublicBadge['id'], string> = {
  quickReply: 'This business usually replies to a new lead within an hour.',
  highlyRated: 'Customers rate this business 4.7 or higher across at least 10 reviews.',
  popularMonth: 'The most visited or most contacted listing in this category and city this month.',
  newOnFinderB: 'This listing went live on FinderB within the last 30 days.',
  trusted: 'FinderB has marked this business as trusted.',
};

const LABEL: Record<PublicBadge['id'], string> = {
  quickReply: 'Quick reply',
  highlyRated: 'Highly rated',
  popularMonth: 'Popular this month',
  newOnFinderB: 'New on FinderB',
  trusted: 'FinderB Trusted',
};

type Mark = {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  ink: string;
};

const DAY: Record<Exclude<PublicBadge['id'], 'trusted'>, Mark> = {
  quickReply: { icon: 'flash', iconColor: '#059669', ink: '#44403C' },
  highlyRated: { icon: 'star', iconColor: '#D97706', ink: '#44403C' },
  popularMonth: { icon: 'trending-up', iconColor: '#E11D48', ink: '#44403C' },
  newOnFinderB: { icon: 'leaf', iconColor: '#0F766E', ink: '#44403C' },
};

const NIGHT: Record<Exclude<PublicBadge['id'], 'trusted'>, Mark> = {
  quickReply: { icon: 'flash', iconColor: '#6EE7B7', ink: '#E7E5E4' },
  highlyRated: { icon: 'star', iconColor: '#FBBF24', ink: '#E7E5E4' },
  popularMonth: { icon: 'trending-up', iconColor: '#FB7185', ink: '#E7E5E4' },
  newOnFinderB: { icon: 'leaf', iconColor: '#5EEAD4', ink: '#E7E5E4' },
};

const GLYPH_DELAY: Record<Exclude<PublicBadge['id'], 'trusted'>, number> = {
  quickReply: 0,
  highlyRated: 450,
  popularMonth: 900,
  newOnFinderB: 1350,
};

export function BadgeLabel({
  children,
  delay = 0,
  style,
}: {
  children: string;
  delay?: number;
  style?: Text['props']['style'];
}) {
  const sweep = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const shine = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(delay),
        Animated.timing(sweep, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1500),
      ]),
    );
    shine.start();
    return () => shine.stop();
  }, [delay, sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, Math.max(width, 12)],
  });

  return (
    <View style={styles.shineWrap} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      <Text style={style}>{children}</Text>
      <Animated.View pointerEvents="none" style={[styles.shine, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,248,230,0.95)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shineFill}
        />
      </Animated.View>
    </View>
  );
}

function isBadge(value: { id?: string } | null | undefined): value is PublicBadge {
  return Boolean(value && value.id && value.id in LABEL);
}

export function PublicBadgeRow({ badges }: { badges?: { id: string; label?: string }[] | null }) {
  const { isDark } = useTheme();
  const looks = isDark ? NIGHT : DAY;
  const visible = (badges || []).filter(isBadge);
  if (!visible.length) return null;

  return (
    <View style={styles.row}>
      {visible.map((badge, index) => {
        const divider = index > 0 ? <Text style={[styles.sep, isDark && styles.sepNight]}>|</Text> : null;
        if (badge.id === 'trusted') {
          return (
            <Fragment key={badge.id}>
            {divider}
            <Pressable
              onPress={() => Alert.alert(LABEL.trusted, HINT.trusted, [{ text: 'Got it' }])}
              style={[styles.trusted, isDark && styles.trustedNight]}
              accessibilityRole="button"
              accessibilityLabel={`${LABEL.trusted}. ${HINT.trusted}`}
            >
              <View style={styles.medallion}>
                <Ionicons name="shield-checkmark" size={11} color="#12263A" />
              </View>
              <Text style={styles.trustedFinder}>FinderB </Text>
              <Text style={styles.trustedWord}>Trusted</Text>
            </Pressable>
            </Fragment>
          );
        }
        const look = looks[badge.id];
        return (
          <Fragment key={badge.id}>
          {divider}
          <Pressable
            onPress={() => Alert.alert(LABEL[badge.id], HINT[badge.id], [{ text: 'Got it' }])}
            style={styles.mark}
            accessibilityRole="button"
            accessibilityLabel={`${LABEL[badge.id]}. ${HINT[badge.id]}`}
          >
            <Ionicons name={look.icon} size={13} color={look.iconColor} />
            <BadgeLabel delay={GLYPH_DELAY[badge.id]} style={[styles.label, { color: look.ink }]}>
              {LABEL[badge.id]}
            </BadgeLabel>
          </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  sep: { color: '#D6D3D1', fontSize: 12, fontWeight: '300', lineHeight: 16 },
  sepNight: { color: 'rgba(231,229,228,0.35)' },
  shineWrap: { overflow: 'hidden' },
  shine: { position: 'absolute', top: 0, bottom: 0, width: 22 },
  shineFill: { flex: 1 },
  mark: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  label: { fontFamily: fonts.semiBold, fontSize: 12, letterSpacing: -0.1 },
  trusted: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    backgroundColor: '#12263A',
    paddingLeft: 3,
    paddingRight: 10,
    paddingVertical: 3,
  },
  trustedNight: { backgroundColor: '#0E1C2C' },
  medallion: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C6A15B',
    marginRight: 5,
  },
  trustedFinder: { fontFamily: fonts.semiBold, fontSize: 12, color: '#FFFFFF' },
  trustedWord: { fontFamily: fonts.medium, fontSize: 12, color: '#F3E2B3' },
});
