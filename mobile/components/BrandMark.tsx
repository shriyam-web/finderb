import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

type BrandMarkProps = {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  tone?: 'light' | 'dark';
  showWordmark?: boolean;
};

const SIZES = {
  sm: { logo: 34, word: 18, gap: 8 },
  md: { logo: 44, word: 22, gap: 10 },
  lg: { logo: 64, word: 28, gap: 12 },
  hero: { logo: 96, word: 36, gap: 14 },
} as const;

export function BrandMark({
  size = 'md',
  tone = 'dark',
  showWordmark = true,
}: BrandMarkProps) {
  const s = SIZES[size];
  const isLight = tone === 'light';

  return (
    <View style={[styles.row, { gap: s.gap }]}>
      <Image
        source={require('../assets/logo1.png')}
        style={{ width: s.logo, height: s.logo }}
        resizeMode="contain"
        accessibilityLabel="FinderB"
      />
      {showWordmark ? (
        <Text
          style={[
            styles.word,
            {
              fontSize: s.word,
              color: isLight ? colors.white : colors.primary700,
            },
          ]}
        >
          FinderB
        </Text>
      ) : null}
    </View>
  );
}

export function FinderBLogo({ size = 48 }: { size?: number }) {
  return (
    <Image
      source={require('../assets/logo1.png')}
      style={{ width: size, height: size }}
      resizeMode="contain"
      accessibilityLabel="FinderB"
    />
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  word: {
    fontWeight: '800',
    letterSpacing: -0.8,
  },
});
