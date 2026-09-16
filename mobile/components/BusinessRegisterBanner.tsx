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

export function BusinessRegisterBanner({ style }: BusinessRegisterBannerProps) {
  const router = useRouter();
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const tiny = width < 340;
  const personW = tiny ? 64 : compact ? 84 : 118;
  const padRight = Math.round(personW * 0.82);

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
          style={[
            styles.left,
            { paddingRight: padRight },
            compact && styles.leftCompact,
          ]}
        >
          <Text
            style={[styles.title, compact && styles.titleCompact]}
            numberOfLines={2}
          >
            Your shop, discovered daily
          </Text>
          <Text
            style={[styles.body, compact && styles.bodyCompact]}
            numberOfLines={compact ? 3 : 2}
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

        <View
          style={[styles.personSlot, { width: personW }]}
          pointerEvents="none"
        >
          <Image
            source={require('../assets/indian-businessman.png')}
            style={styles.person}
            contentFit="cover"
            contentPosition={{ top: 0, right: 0 }}
            transition={120}
          />
        </View>
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
    minHeight: 128,
    overflow: 'hidden',
    position: 'relative',
  },
  cardCompact: {
    minHeight: 112,
  },
  left: {
    flex: 1,
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 16,
    paddingLeft: 16,
    minWidth: 0,
    zIndex: 1,
  },
  leftCompact: {
    gap: 5,
    paddingVertical: 12,
    paddingLeft: 12,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.onDark,
  },
  titleCompact: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.onDark,
    opacity: 0.88,
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
  personSlot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
  },
  person: {
    width: '100%',
    height: '100%',
  },
}));
