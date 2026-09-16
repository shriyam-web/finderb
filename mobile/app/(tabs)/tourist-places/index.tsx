import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '../../../components/ScreenHeader';
import { fonts } from '../../../constants/typography';
import { useAppLocation } from '../../../context/LocationContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchTouristPlaces,
  resolveTouristPlaceSlug,
  type TouristPlace,
} from '../../../lib/touristPlaces';
import { backToMore } from '../../../lib/navigation';

export default function TouristPlacesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const location = useAppLocation();
  const bottomPad = useTabScrollPadding(24);
  const [places, setPlaces] = useState<TouristPlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await fetchTouristPlaces(40, {
      city: location.city,
      state: location.region,
      coords: location.coords,
    });
    setPlaces(result.places);
    setError(result.error || '');
    setLoading(false);
  }, [location.city, location.coords, location.region]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const openPlace = (place: TouristPlace) => {
    router.push(
      `/(tabs)/tourist-places/${resolveTouristPlaceSlug(place)}` as Href,
    );
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Tourist places"
          variant="bar"
          onBack={() => backToMore(router)}
        />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <FlatList
            data={places}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={[
              styles.list,
              { paddingBottom: bottomPad },
              places.length === 0 && styles.listEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.center}>
                <Text style={styles.emptyTitle}>No destinations yet</Text>
                <Text style={styles.emptyText}>
                  {error || 'Check back soon for new places to explore.'}
                </Text>
              </View>
            }
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => openPlace(item)}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <Image
                  source={{ uri: item.image }}
                  style={styles.thumb}
                  contentFit="cover"
                />
                <View style={styles.copy}>
                  {item.category ? (
                    <Text style={styles.badge}>{item.category}</Text>
                  ) : null}
                  <Text style={styles.title} numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name="location-outline"
                      size={13}
                      color={colors.textSoft}
                    />
                    <Text style={styles.meta} numberOfLines={1}>
                      {item.location}
                    </Text>
                  </View>
                  {item.distanceLabel ? (
                    <Text style={styles.distance}>{item.distanceLabel}</Text>
                  ) : null}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textSoft}
                />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, paddingTop: 8 },
  list: { paddingHorizontal: 16, paddingTop: 8 },
  listEmpty: { flexGrow: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  thumb: {
    width: 84,
    height: 84,
    borderRadius: 12,
    backgroundColor: colors.muted,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    fontFamily: fonts.bold,
    fontSize: 10,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.brand,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 20,
    color: colors.heading,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meta: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  distance: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.open,
  },
  pressed: { opacity: 0.94 },
}));
