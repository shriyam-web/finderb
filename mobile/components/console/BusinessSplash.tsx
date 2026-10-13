import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StatusBar, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useAuth } from '../../context/AuthContext';
import { createConsoleStyles } from './kit';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fbMark = require('../../assets/fb-mark-clear.png');

const TRACK_WIDTH = 132;
const RUNNER_WIDTH = 44;

/** Opening screen for the business panel: the FinderB mark, the shop name and a quiet progress line. */
export function BusinessSplash() {
  const styles = useStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [enter] = useState(() => new Animated.Value(0));
  const [run] = useState(() => new Animated.Value(0));
  const shopName = user?.businessName?.trim();

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.timing(run, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, run]);

  const lift = enter.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });
  const scale = enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const runnerX = run.interpolate({ inputRange: [0, 1], outputRange: [-RUNNER_WIDTH, TRACK_WIDTH] });

  return (
    <View
      style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom + 36 }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Opening FinderB Business"
    >
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} />
      <Animated.View style={[styles.center, { opacity: enter, transform: [{ translateY: lift }, { scale }] }]}>
        <View style={styles.tile}>
          <Image source={fbMark} style={styles.mark} resizeMode="contain" alt="FinderB" />
        </View>
        <Text style={styles.word}>
          FinderB <Text style={styles.wordAccent}>Business</Text>
        </Text>
        {shopName ? (
          <Text style={styles.shop} numberOfLines={1}>
            {shopName}
          </Text>
        ) : null}
      </Animated.View>

      <Animated.View style={[styles.foot, { opacity: enter }]}>
        <View style={styles.track}>
          <Animated.View style={[styles.runner, { transform: [{ translateX: runnerX }] }]} />
        </View>
        <Text style={styles.footText}>Loading your dashboard</Text>
      </Animated.View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  page: { flex: 1, backgroundColor: c.card, alignItems: 'center', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  tile: {
    width: 92,
    height: 92,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: c.isDark ? 0 : 1,
    borderColor: c.line,
    shadowColor: '#101828',
    shadowOpacity: c.isDark ? 0 : 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: c.isDark ? 0 : 4,
  },
  mark: { width: 58, height: 58 },
  word: { marginTop: 22, fontFamily: fonts.semiBold, fontSize: 22, color: c.ink },
  wordAccent: { color: c.primary },
  shop: { marginTop: 6, maxWidth: 280, fontFamily: fonts.regular, fontSize: 14.5, color: c.muted },
  foot: { alignItems: 'center', gap: 12 },
  track: {
    width: TRACK_WIDTH,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: c.sunken,
  },
  runner: { width: RUNNER_WIDTH, height: 3, borderRadius: 2, backgroundColor: c.primary },
  footText: { fontFamily: fonts.regular, fontSize: 12.5, color: c.faint },
}));
