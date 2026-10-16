import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { listingThumbUrl, type Merchant } from '../lib/merchants';
import { getRatingDisplay, UNRATED_LABEL } from '../lib/ratingDisplay';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  merchant: Merchant;
  onPress: () => void;
  distanceLabel?: string | null;
  variant?: 'rail' | 'spotlight' | 'compact';
};

export function MerchantCard({
  merchant,
  onPress,
  distanceLabel,
  variant = 'rail',
}: Props) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const overlayText =
    isDarkPalette(colors) ? colors.primary : colors.onDark;
  const rating = getRatingDisplay(merchant.rating, merchant.reviewsCount);
  const hasOffer =
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer';
  const isSpotlight = variant === 'spotlight';
  const isCompact = variant === 'compact';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        isSpotlight && styles.cardSpotlight,
        isCompact && styles.cardCompact,
        !isSpotlight && !isCompact && styles.cardRail,
        pressed && styles.pressed,
      ]}
    >
      <View
        style={[
          styles.hero,
          isSpotlight && styles.heroSpotlight,
          isCompact && styles.heroCompact,
        ]}
      >
        {merchant.image ? (
          <Image
            source={{ uri: listingThumbUrl(merchant.image) || merchant.image }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={merchant.id}
            transition={0}
          />
        ) : (
          <LinearGradient
            colors={[...gradients.spotlight]}
            style={styles.imageFallback}
          >
            <Text style={styles.fallbackInitial}>
              {merchant.name.slice(0, 1).toUpperCase()}
            </Text>
          </LinearGradient>
        )}

        {distanceLabel ? (
          <View style={styles.distancePill}>
            <Ionicons name="navigate-outline" size={11} color={overlayText} />
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.name}
          </Text>
          {merchant.isVerified ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={10} color={colors.onDark} />
            </View>
          ) : null}
        </View>

        <Text style={styles.category} numberOfLines={1}>
          {merchant.category || 'Business'}
        </Text>

        <View style={styles.metaRow}>
          {rating.rated ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={11} color={colors.star} />
              <Text style={styles.metaText}>
                {rating.label}
                {rating.showCount ? ` (${rating.reviewCount})` : ''}
              </Text>
            </View>
          ) : (
            <Text style={styles.metaText}>New · {UNRATED_LABEL}</Text>
          )}
        </View>

        <View style={styles.locRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSoft} />
          <Text style={styles.locText} numberOfLines={1}>
            {merchant.location || merchant.city || 'India'}
          </Text>
        </View>

        {hasOffer ? (
          <Text style={styles.offer} numberOfLines={1}>
            {merchant.discountRange}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardRail: { width: 196 },
  cardSpotlight: { width: 260 },
  cardCompact: { width: 160 },
  pressed: { opacity: 0.94 },
  hero: {
    height: 118,
    backgroundColor: colors.muted,
  },
  heroSpotlight: { height: 148 },
  heroCompact: { height: 100 },
  image: { width: '100%', height: '100%' },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontFamily: fonts.semiBold,
    fontSize: 34,
    color: isDarkPalette(colors) ? colors.primary : colors.onDark,
  },
  distancePill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlay,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  distanceText: {
    fontFamily: fonts.medium,
    color: isDarkPalette(colors) ? colors.primary : colors.onDark,
    fontSize: 11,
  },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  verified: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 1,
  },
  locText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
  },
  offer: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primary,
  },
}));

function isDarkPalette(colors: { statusBarStyle: 'light' | 'dark' }) {
  return colors.statusBarStyle === 'light';
}
