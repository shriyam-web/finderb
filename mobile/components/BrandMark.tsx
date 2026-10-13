import { Image, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  tone?: 'light' | 'dark';
  showWordmark?: boolean;
};

const SIZES = {
  sm: { logo: 28, word: 16, gap: 8 },
  md: { logo: 36, word: 20, gap: 10 },
  lg: { logo: 52, word: 26, gap: 12 },
  hero: { logo: 72, word: 32, gap: 14 },
} as const;

/** Compact FB mark only — transparent glyph, no plate / bg. */
export function FinderBLogo({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/fb-glyph-240.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="FinderB"
    />
  );
}

export function BrandMark({
  size = 'md',
  tone = 'dark',
  showWordmark = false,
}: BrandMarkProps) {
  const { colors, isDark } = useTheme();
  const s = SIZES[size];
  const isLight = tone === 'light';
  const lightWord = isDark ? colors.primary : colors.onDark;

  return (
    <View style={[styles.row, { gap: s.gap }]}>
      <FinderBLogo size={s.logo} />
      {showWordmark ? (
        <Text
          style={[
            styles.word,
            {
              fontSize: s.word,
              color: isLight ? lightWord : colors.heading,
            },
          ]}
        >
          FinderB
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
