import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getBusinessOpenStatus } from '../lib/businessHours';
import { getRatingDisplay, UNRATED_LABEL } from '../lib/ratingDisplay';
import type { HomeCategory } from '../lib/api';
import { listingThumbUrl, type Merchant } from '../lib/merchants';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  category: HomeCategory;
  merchants: Merchant[];
  getDistanceLabel?: (merchant: Merchant) => string | null | undefined;
  onOpenCategory: () => void;
  onOpenMerchant: (merchant: Merchant) => void;
};

function categoryLabel(raw: string): string {
  if (!raw) return 'Business';
  const leaf = raw.includes('›') ? raw.split('›').pop()!.trim() : raw.trim();
  return leaf || 'Business';
}

function ShelfMerchantCard({
  merchant,
  distanceLabel,
  onPress,
}: {
  merchant: Merchant;
  distanceLabel?: string | null;
  onPress: () => void;
}) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const overlayText =
    colors.statusBarStyle === 'light' ? colors.primary : colors.onDark;
  const rating = getRatingDisplay(merchant.rating, merchant.reviewsCount);
  const open = getBusinessOpenStatus(merchant.timings);
  const hasOffer =
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer';
  const place = merchant.location || merchant.city || '';
  const about = (merchant.about || '').trim();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {merchant.image ? (
          <Image
            source={{ uri: listingThumbUrl(merchant.image) || merchant.image }}
            style={styles.photoImg}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={merchant.id}
            transition={0}
          />
        ) : (
          <LinearGradient colors={[...gradients.spotlight]} style={styles.photoImg}>
            <Text style={styles.initial}>{merchant.name.slice(0, 1)}</Text>
          </LinearGradient>
        )}

        {distanceLabel ? (
          <View style={styles.distancePill}>
            <Ionicons name="navigate-outline" size={10} color={overlayText} />
            <Text style={styles.distanceText}>{distanceLabel}</Text>
          </View>
        ) : null}

        {open.status === 'Open' || open.status === 'Closed' ? (
          <View
            style={[
              styles.statusPill,
              open.status === 'Open' ? styles.statusOpen : styles.statusClosed,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                open.status === 'Open' ? styles.statusTextOpen : styles.statusTextClosed,
              ]}
            >
              {open.status === 'Open' ? 'Open' : open.label || 'Closed'}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {merchant.name}
          </Text>
          {merchant.isVerified ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={9} color={colors.onDark} />
            </View>
          ) : null}
        </View>

        <Text style={styles.category} numberOfLines={1}>
          {categoryLabel(merchant.category)}
        </Text>

        <View style={styles.metaRow}>
          {rating.rated ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.metaStrong}>{rating.label}</Text>
              {rating.showCount ? (
                <Text style={styles.meta}>({rating.reviewCount})</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.meta}>{UNRATED_LABEL}</Text>
          )}
        </View>

        {place ? (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={12} color={colors.textSoft} />
            <Text style={styles.locText} numberOfLines={1}>
              {place}
            </Text>
          </View>
        ) : null}

        {about ? (
          <Text style={styles.about} numberOfLines={2}>
            {about}
          </Text>
        ) : null}

        {hasOffer ? (
          <View style={styles.offerRow}>
            <Ionicons name="pricetag-outline" size={11} color={colors.primary} />
            <Text style={styles.offer} numberOfLines={1}>
              {merchant.discountRange}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function CategoryMerchantShelf({
  category,
  merchants,
  getDistanceLabel,
  onOpenCategory,
  onOpenMerchant,
}: Props) {
  const styles = useStyles();
  return (
    <View style={styles.shelf}>
      <Pressable style={styles.head} onPress={onOpenCategory}>
        <View style={styles.headLeft}>
          {category.icon ? (
            <Image
              source={{ uri: category.icon }}
              style={styles.catIcon}
              contentFit="contain"
            />
          ) : null}
          <Text style={styles.title} numberOfLines={1}>
            {category.name}
          </Text>
        </View>
        <Text style={styles.more}>See all</Text>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
        decelerationRate="fast"
        nestedScrollEnabled
      >
        {merchants.map((merchant) => (
          <ShelfMerchantCard
            key={merchant.id}
            merchant={merchant}
            distanceLabel={getDistanceLabel?.(merchant)}
            onPress={() => onOpenMerchant(merchant)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  shelf: {
    marginBottom: 20,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 10,
  },
  headLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catIcon: {
    width: 18,
    height: 18,
  },
  title: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.heading,
  },
  more: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.accent,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 220,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.94 },
  photo: {
    height: 118,
    backgroundColor: colors.muted,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    color:
      colors.statusBarStyle === 'light' ? colors.primary : colors.onDark,
  },
  distancePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.overlay,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  distanceText: {
    fontFamily: fonts.medium,
    fontSize: 10,
    color:
      colors.statusBarStyle === 'light' ? colors.primary : colors.onDark,
  },
  statusPill: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusOpen: {
    backgroundColor: colors.successBg,
  },
  statusClosed: {
    backgroundColor: colors.heatSoft,
  },
  statusText: {
    fontFamily: fonts.medium,
    fontSize: 10,
  },
  statusTextOpen: { color: colors.open },
  statusTextClosed: { color: colors.closed },
  body: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  verified: {
    marginTop: 2,
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
  metaStrong: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 11,
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
  about: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  offerRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  offer: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.primary,
  },
}));
