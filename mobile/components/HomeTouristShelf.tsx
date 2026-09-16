import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { TouristPlace } from '../lib/touristPlaces';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  places: TouristPlace[];
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  onSeeAll: () => void;
  onOpenPlace: (place: TouristPlace) => void;
};

function PlacePhoto({ uri }: { uri: string }) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const overlayIcon = isDark ? colors.primary : colors.onDark;
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <View style={styles.photo}>
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={160}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.photoFallback}>
          <Ionicons name="image-outline" size={28} color={overlayIcon} />
        </View>
      )}
    </View>
  );
}

/** Homepage destinations shelf — photo-led cards, nearest first. */
export function HomeTouristShelf({
  places,
  loading,
  error,
  onRetry,
  onSeeAll,
  onOpenPlace,
}: Props) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const { width: windowWidth } = useWindowDimensions();
  const cardW = Math.min(280, Math.round(windowWidth * 0.72));
  const visible = places.slice(0, 6);

  return (
    <View style={styles.shelf}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <Text style={styles.title}>Explore Destinations</Text>
        </View>
        <Pressable onPress={onSeeAll} hitSlop={8} style={styles.seeAll}>
          <Text style={styles.seeAllText}>View all</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.brand} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.stateBox}>
          <ActivityIndicator color={colors.brand} />
          <Text style={styles.stateText}>Finding nearby destinations…</Text>
        </View>
      ) : visible.length === 0 ? (
        <View style={styles.stateBox}>
          <Text style={styles.stateText}>
            {error || 'Destinations will appear here soon.'}
          </Text>
          {onRetry ? (
            <Pressable style={styles.retryBtn} onPress={onRetry}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rail}
          decelerationRate="fast"
          nestedScrollEnabled
          snapToInterval={cardW + 12}
          snapToAlignment="start"
          disableIntervalMomentum
        >
          {visible.map((place) => (
            <Pressable
              key={place.id}
              onPress={() => onOpenPlace(place)}
              style={({ pressed }) => [
                styles.card,
                { width: cardW },
                pressed && styles.pressed,
              ]}
            >
              <PlacePhoto uri={place.image} />
              <LinearGradient
                colors={[...gradients.cardOverlay]}
                style={styles.photoScrim}
              />
              <View style={styles.cardBody}>
                <Text style={styles.name} numberOfLines={2}>
                  {place.name}
                </Text>
                <View style={styles.metaRow}>
                  <Ionicons
                    name="location"
                    size={12}
                    color="#FFFFFF"
                  />
                  <Text style={styles.location} numberOfLines={1}>
                    {place.location}
                  </Text>
                </View>
                <View style={styles.footerRow}>
                  <View style={styles.ratingPill}>
                    <Ionicons name="star" size={11} color={colors.star} />
                    <Text style={styles.rating}>{place.rating.toFixed(1)}</Text>
                  </View>
                  {place.distanceLabel ? (
                    <Text style={styles.distance}>{place.distanceLabel}</Text>
                  ) : place.category ? (
                    <Text style={styles.category} numberOfLines={1}>
                      {place.category}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  shelf: {
    marginBottom: 8,
    paddingTop: 4,
    backgroundColor: colors.canvas,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 14,
    gap: 12,
  },
  headLeft: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 4,
  },
  seeAllText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 6,
  },
  card: {
    height: 196,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  pressed: { opacity: 0.94 },
  photo: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.primary200,
  },
  photoFallback: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary300,
  },
  photoScrim: {
    ...StyleSheet.absoluteFill,
  },
  cardBody: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 14,
    gap: 6,
  },
  name: {
    fontFamily: fonts.bold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.2,
    color:
      colors.statusBarStyle === 'light' ? colors.primary : colors.onDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  location: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.82)',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  rating: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color:
      colors.statusBarStyle === 'light' ? colors.primary : colors.onDark,
  },
  distance: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.secondary,
  },
  category: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  stateBox: {
    marginHorizontal: 16,
    paddingVertical: 28,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    gap: 8,
  },
  stateText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  retryText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.onDark,
  },
}));
