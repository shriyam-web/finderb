import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';

/** The one thing left to do on a draft, with a light streak so it stands out. */
export function NextAction({ label }: { label: string }) {
  const c = useConsoleColors();
  const sweep = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(700),
        Animated.timing(sweep, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [sweep]);

  const travel = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, Math.max(width, 24)],
  });
  const ink = c.isDark ? '#1C1917' : '#FFFFFF';

  return (
    <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)} style={[styles.pill, { backgroundColor: c.brand }]}>
      <Text style={[styles.label, { color: ink }]}>{label}</Text>
      <Animated.View pointerEvents="none" style={[styles.gleam, { transform: [{ translateX: travel }, { rotate: '18deg' }] }]} />
    </View>
  );
}

const styles = {
  pill: {
    alignSelf: 'flex-start' as const,
    marginTop: 4,
    overflow: 'hidden' as const,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16 },
  gleam: {
    position: 'absolute' as const,
    top: -6,
    width: 10,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
};
