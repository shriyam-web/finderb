import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Merchant } from '../lib/merchants';
import { colors } from '../constants/colors';
import { fonts } from '../constants/typography';

type Props = {
  merchant: Merchant;
  onPress: () => void;
};

export function MerchantCard({ merchant, onPress }: Props) {
  const ratingLabel =
    merchant.rating != null ? merchant.rating.toFixed(1) : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.hero}>
        {merchant.image ? (
          <Image
            source={{ uri: merchant.image }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <LinearGradient
            colors={[colors.mango, colors.heat]}
            style={styles.imageFallback}
          >
            <Text style={styles.fallbackInitial}>
              {merchant.name.slice(0, 1).toUpperCase()}
            </Text>
          </LinearGradient>
        )}
        {ratingLabel ? (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={11} color={colors.white} />
            <Text style={styles.ratingText}>{ratingLabel}</Text>
          </View>
        ) : null}
        {merchant.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="checkmark-circle" size={14} color={colors.teal} />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {merchant.name}
        </Text>
        <Text style={styles.category} numberOfLines={1}>
          {merchant.category || 'Business'}
        </Text>
        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={12} color={colors.textSoft} />
          <Text style={styles.meta} numberOfLines={1}>
            {merchant.location || merchant.city || 'India'}
            {merchant.reviewsCount > 0 ? ` · ${merchant.reviewsCount} reviews` : ''}
          </Text>
        </View>
        {merchant.discountRange &&
        merchant.discountRange !== 'No Discount' &&
        merchant.discountRange !== 'Seasonal Offer' ? (
          <View style={styles.offer}>
            <Text style={styles.offerText}>{merchant.discountRange}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 188,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  hero: {
    height: 112,
    backgroundColor: colors.canvasDeep,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackInitial: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    color: colors.white,
  },
  ratingPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 11,
  },
  verified: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: 12,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  category: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  metaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  offer: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: colors.heatSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  offerText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.heat,
  },
});
