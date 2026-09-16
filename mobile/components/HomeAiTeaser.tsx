import { Image } from 'expo-image';
import { Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

type Props = {
  onPress: () => void;
};

/** Intrinsic banner size from public/meet-ai.png */
const BANNER_ASPECT = 1441 / 353;

export function HomeAiTeaser({ onPress }: Props) {
  const { width: windowWidth } = useWindowDimensions();
  const bannerWidth = Math.max(280, windowWidth > 0 ? windowWidth - 32 : 328);
  const bannerHeight = Math.max(72, Math.round(bannerWidth / BANNER_ASPECT));

  return (
    <View style={styles.wrap} collapsable={false}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { width: bannerWidth, height: bannerHeight },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Meet FinderB AI"
      >
        <Image
          source={require('../assets/meet-ai.png')}
          style={styles.image}
          contentFit="contain"
          cachePolicy="memory-disk"
          recyclingKey="meet-ai-banner"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 11,
    paddingHorizontal: 16,
    paddingTop: 7,
    alignItems: 'center',
    minHeight: 88,
  },
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  pressed: { opacity: 0.94 },
  image: {
    width: '100%',
    height: '100%',
  },
});
