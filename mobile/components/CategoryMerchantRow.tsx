import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBusinessOpenStatus } from '../lib/businessHours';
import { getRatingDisplay, UNRATED_LABEL } from '../lib/ratingDisplay';
import { useDrivingDistanceLabel } from '../lib/drivingDistance';
import { listingThumbUrl, type Merchant } from '../lib/merchants';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  merchant: Merchant;
  distanceLabel?: string | null;
  contactRevealed?: boolean;
  onRequestLogin?: () => void;
  onPress: () => void;
};

function maskPhone(value?: string | null): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'Login to view';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'Login to view';
  return `${digits.slice(0, 2)}${'•'.repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`;
}

export function CategoryMerchantRow({
  merchant,
  contactRevealed = false,
  onRequestLogin,
  onPress,
}: Props) {
  const distanceLabel = useDrivingDistanceLabel(merchant.latitude, merchant.longitude);
  const { colors } = useTheme();
  const styles = useStyles();
  const rating = getRatingDisplay(merchant.rating, merchant.reviewsCount);
  const open = getBusinessOpenStatus(merchant.timings);
  const hasOffer =
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer';
  const about = merchant.about?.trim() || '';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.thumbWrap}>
        {merchant.image ? (
          <Image
            source={{ uri: listingThumbUrl(merchant.image) || merchant.image }}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={merchant.id}
            transition={0}
          />
        ) : (
          <LinearGradient
            colors={[colors.primary400, colors.primary600]}
            style={styles.thumb}
          >
            <Text style={styles.initial}>{merchant.name.slice(0, 1)}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {merchant.name}
          </Text>
          {merchant.isVerified ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={9} color="#fff" />
            </View>
          ) : null}
        </View>

        <Text style={styles.category} numberOfLines={1}>
          {merchant.category || 'Business'}
        </Text>

        <View style={styles.metaRow}>
          {open.status !== 'Unknown' ? (
            <Text
              style={[
                styles.openText,
                open.status === 'Open' ? styles.open : styles.closed,
              ]}
            >
              {open.label}
            </Text>
          ) : null}
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
            {distanceLabel ? `${distanceLabel} · ` : ''}
            {merchant.location || merchant.city || 'India'}
          </Text>
        </View>

        {merchant.contact ? (
          contactRevealed ? (
            <Text style={styles.phone} numberOfLines={1}>
              {merchant.contact}
            </Text>
          ) : (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onRequestLogin?.();
              }}
              hitSlop={6}
            >
              <Text style={styles.phoneMasked}>{maskPhone(merchant.contact)}</Text>
            </Pressable>
          )
        ) : null}

        {about ? (
          <Text style={styles.about} numberOfLines={2}>
            {about}
          </Text>
        ) : null}

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
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
  },
  pressed: { opacity: 0.94 },
  thumbWrap: {
    width: 96,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surfaceSoft,
  },
  thumb: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  initial: {
    fontFamily: fonts.semiBold,
    fontSize: 26,
    color: colors.onDark,
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  name: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  verified: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 1,
  },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  openText: {
    fontFamily: fonts.medium,
    fontSize: 11,
  },
  open: { color: colors.open },
  closed: { color: colors.closed },
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
  phone: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.brand,
  },
  phoneMasked: {
    marginTop: 2,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
    textDecorationLine: 'underline',
  },
  about: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  offer: {
    marginTop: 3,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.brand,
  },
}));
