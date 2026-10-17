import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { searchDirectory, type DirectorySearchResult, type HomeCategory } from '../lib/api';
import type { Coords } from '../lib/geo';
import type { Merchant } from '../lib/merchants';
import { CategoryMerchantRow } from './CategoryMerchantRow';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  query: string;
  coords?: Coords | null;
  city?: string | null;
  signedIn: boolean;
  onOpenCategory: (category: HomeCategory) => void;
  onOpenMerchant: (merchant: Merchant) => void;
};

export function HomeSearchPanel({
  query,
  coords,
  city,
  signedIn,
  onOpenCategory,
  onOpenMerchant,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<DirectorySearchResult | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    void searchDirectory(query, { coords, city }).then((next) => {
      if (!alive) return;
      setResult(next);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [query, coords, city]);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Results for “{query}”</Text>
      {result?.notice ? <Text style={styles.notice}>{result.notice}</Text> : null}
      {result?.error ? <Text style={styles.notice}>{result.error}</Text> : null}
      {loading ? (
        <ActivityIndicator style={styles.loader} color={colors.brand} />
      ) : (
        <>
          {result && result.categories.length > 0 ? (
            <>
              <Text style={styles.label}>Categories</Text>
              {result.categories.map((category) => (
                <Pressable
                  key={category.id}
                  style={styles.categoryRow}
                  onPress={() => onOpenCategory(category)}
                  accessibilityRole="button"
                >
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {category.name}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}
          <Text style={styles.label}>Businesses</Text>
          {!result || result.merchants.length === 0 ? (
            <Text style={styles.empty}>No matching businesses</Text>
          ) : (
            <View style={styles.list}>
              {result.merchants.map((merchant) => (
                <CategoryMerchantRow
                  key={merchant.id}
                  merchant={merchant}
                  contactRevealed={signedIn}
                  onPress={() => onOpenMerchant(merchant)}
                />
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const useStyles = createThemedStyles((colors) =>
  StyleSheet.create({
    wrap: {
      marginTop: 8,
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 8,
      backgroundColor: colors.canvas,
      gap: 8,
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 16,
      color: colors.ink,
    },
    notice: {
      fontFamily: fonts.regular,
      fontSize: 13,
      lineHeight: 18,
      color: colors.textSoft,
    },
    label: {
      marginTop: 6,
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.textSoft,
    },
    categoryRow: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    categoryName: {
      fontFamily: fonts.medium,
      fontSize: 14,
      color: colors.ink,
    },
    list: {
      gap: 8,
    },
    empty: {
      fontFamily: fonts.regular,
      fontSize: 14,
      color: colors.textSoft,
    },
    loader: {
      marginVertical: 24,
    },
  }),
);
