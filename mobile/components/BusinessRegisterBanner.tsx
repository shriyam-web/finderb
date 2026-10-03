import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type BusinessRegisterBannerProps = {
  style?: object;
};

const PERSON = require('../assets/indian-businessman-banner.png');
const PERSON_ASPECT = 427 / 640;
const PERSON_TOP_GAP = 10;

export function BusinessRegisterBanner({ style }: BusinessRegisterBannerProps) {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const cardH = compact ? 124 : 136;

  const personH = cardH - PERSON_TOP_GAP;
  const personW = Math.round(personH * PERSON_ASPECT);
  const glow = Math.round(personH * 1.05);

  return (
    <Pressable
      onPress={() => router.push('/business-app' as Href)}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed, style]}
      accessibilityRole="button"
      accessibilityLabel="List your business on FinderB"
    >
      <LinearGradient
        colors={gradients.promo}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[styles.card, compact && styles.cardCompact]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              width: glow,
              height: glow,
              borderRadius: glow / 2,
              right: Math.round(personW / 2 - glow / 2) + 8,
              bottom: -Math.round(glow * 0.28),
            },
          ]}
        />

        <View
          style={[
            styles.left,
            compact && styles.leftCompact,
            { marginRight: personW + 4 },
          ]}
        >
          <Text
            style={[styles.title, compact && styles.titleCompact]}
            numberOfLines={2}
          >
            Your business, discovered daily
          </Text>
          <Text
            style={[styles.body, compact && styles.bodyCompact]}
            numberOfLines={3}
          >
            Free listing. Show up when nearby customers are ready to buy.
          </Text>
          <View style={[styles.cta, compact && styles.ctaCompact]}>
            <Text style={[styles.ctaText, compact && styles.ctaTextCompact]}>
              List my business
            </Text>
            <Ionicons
              name="arrow-forward"
              size={compact ? 12 : 14}
              color={colors.ink}
            />
          </View>
        </View>

        <Image
          source={PERSON}
          pointerEvents="none"
          style={[styles.person, { width: personW, height: personH }]}
          contentFit="contain"
          contentPosition="bottom"
          transition={0}
        />
      </LinearGradient>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.92,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 136,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 16,
  },
  cardCompact: {
    minHeight: 124,
  },
  glow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  left: {
    flex: 1,
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 4,
    minWidth: 0,
    zIndex: 1,
  },
  leftCompact: {
    gap: 5,
    paddingVertical: 12,
    paddingLeft: 14,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.3,
    color: colors.onDark,
  },
  titleCompact: {
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onDark,
    opacity: 0.9,
  },
  bodyCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  ctaCompact: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 4,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  ctaTextCompact: {
    fontSize: 12,
  },
  person: {
    position: 'absolute',
    right: 4,
    bottom: 0,
  },
}));
