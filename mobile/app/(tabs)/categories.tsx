import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { categories } from '../../constants/categories';
import { colors, gradients } from '../../constants/colors';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';

export default function CategoriesScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const listPad = useTabScrollPadding(20);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q),
    );
  }, [query]);

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.soft]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Explore</Text>
          <Text style={styles.title}>Find your category</Text>
          <Text style={styles.subtitle}>
            Tap into what your city is searching for
          </Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={18} color={colors.mangoDeep} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Search categories"
            placeholderTextColor={colors.textSoft}
            autoCorrect={false}
          />
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: listPad }]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => router.push('/(tabs)/home')}
            >
              <View style={[styles.iconWrap, { backgroundColor: `${item.color}22` }]}>
                <Ionicons
                  name={item.icon as keyof typeof Ionicons.glyphMap}
                  size={24}
                  color={item.color}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.name}</Text>
                <Text style={styles.rowSub}>{item.subtitle}</Text>
              </View>
              <View style={styles.chevron}>
                <Ionicons name="arrow-forward" size={16} color={colors.ink} />
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No categories match “{query}”</Text>
          }
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.mangoDeep,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    marginTop: 4,
    fontSize: 30,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.7,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: colors.textMuted,
  },
  searchBox: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: 10,
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
  },
  rowSub: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.canvasDeep,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
