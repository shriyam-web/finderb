import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Animated, Easing, Image, StatusBar, Text, View } from 'react-native';
import { Asset } from 'expo-asset';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useAuth } from '../../context/AuthContext';
import { createConsoleStyles } from './kit';

const MARK = require('../../assets/fb-glyph-240.png');

const LINES = [
  'Opening your business',
  'Getting your business ready',
  'Bringing in today’s leads',
  'Checking new reviews',
  'Seeing who reached out',
  'Preparing your day',
  'Almost ready',
];

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

function TextWipe({ ready, children }: { ready: boolean; children: ReactNode }) {
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!ready || !width) return;
    const hiddenLeft = -width;
    const hiddenRight = width;
    x.setValue(hiddenLeft);
    const wipeIn = () => Animated.timing(x, { toValue: 0, duration: 720, easing: EASE, useNativeDriver: true });
    const wipeOn = () =>
      Animated.timing(x, {
        toValue: hiddenRight,
        duration: 640,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      });
    const reset = () => Animated.timing(x, { toValue: hiddenLeft, duration: 0, useNativeDriver: true });
    const run = Animated.sequence([
      wipeIn(),
      Animated.delay(420),
      wipeOn(),
      reset(),
      wipeIn(),
      Animated.delay(420),
      wipeOn(),
      reset(),
      wipeIn(),
    ]);
    run.start();
    return () => run.stop();
  }, [ready, width, x]);

  return (
    <View style={[stylesWipe, width ? { width } : { opacity: 0 }]}>
      <Animated.View
        style={{ transform: [{ translateX: width ? x : 0 }] }}
        onLayout={(event) => {
          const next = Math.ceil(event.nativeEvent.layout.width);
          if (!next || next === width) return;
          x.setValue(-next);
          setWidth(next);
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const stylesWipe = { overflow: 'hidden' as const };

/** Opening screen for the business panel. Full screen, no dock. */
export function BusinessSplash() {
  const styles = useStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const shopName = user?.businessName?.trim();
  const enter = useRef(new Animated.Value(0)).current;
  const line = useRef(new Animated.Value(1)).current;
  const [lineIndex, setLineIndex] = useState(0);
  const [markReady, setMarkReady] = useState(false);

  useEffect(() => {
    void Asset.fromModule(MARK).downloadAsync().catch(() => undefined);
    const backup = setTimeout(() => setMarkReady(true), 700);
    return () => clearTimeout(backup);
  }, []);

  useEffect(() => {
    if (!markReady) return;
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 1100,
      easing: EASE,
      useNativeDriver: true,
    }).start();
  }, [enter, markReady]);

  useEffect(() => {
    let alive = true;
    let index = 0;
    const swap = () => {
      Animated.timing(line, {
        toValue: 0,
        duration: 320,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!alive || !finished) return;
        index = (index + 1) % LINES.length;
        setLineIndex(index);
        Animated.timing(line, {
          toValue: 1,
          duration: 480,
          easing: EASE,
          useNativeDriver: true,
        }).start();
      });
    };
    const id = setInterval(swap, 1900);
    return () => {
      alive = false;
      clearInterval(id);
      line.stopAnimation();
    };
  }, [line]);

  const shopOpacity = enter.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });
  const footOpacity = enter.interpolate({ inputRange: [0, 0.62, 1], outputRange: [0, 0, 1] });

  return (
    <View
      style={[styles.page, { paddingTop: insets.top, paddingBottom: insets.bottom + 28 }]}
      accessibilityRole="progressbar"
      accessibilityLabel="Opening your business"
    >
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.center}>
        <View style={styles.lockup}>
          <Image
            source={MARK}
            fadeDuration={0}
            onLoad={() => setMarkReady(true)}
            onError={() => setMarkReady(true)}
            style={styles.mark}
            resizeMode="contain"
            accessibilityLabel="FinderB"
          />
          <TextWipe ready={markReady}>
            <View style={styles.words}>
              <Text style={styles.pipe}>|</Text>
              <Text style={styles.word}>Business</Text>
            </View>
          </TextWipe>
        </View>
        {shopName ? (
          <Animated.Text style={[styles.shop, { opacity: shopOpacity }]} numberOfLines={1}>
            {shopName}
          </Animated.Text>
        ) : null}
      </View>

      <Animated.View style={[styles.foot, { opacity: footOpacity }]}>
        <ActivityIndicator size="small" color={c.ink} />
        <Animated.Text style={[styles.footText, { opacity: line }]}>{LINES[lineIndex]}</Animated.Text>
      </Animated.View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  page: { flex: 1, backgroundColor: c.card, alignItems: 'center', justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  lockup: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  words: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  mark: { width: 42, height: 42 },
  pipe: { fontFamily: fonts.medium, fontSize: 22, color: c.isDark ? '#A39E98' : '#D8D8E0', marginTop: -1 },
  word: { fontFamily: fonts.semiBold, fontSize: 26, color: c.ink, letterSpacing: -0.3 },
  shop: { marginTop: 12, maxWidth: 280, fontFamily: fonts.regular, fontSize: 15, color: c.muted, textAlign: 'center' },
  foot: { alignItems: 'center', gap: 12, minHeight: 48 },
  footText: { fontFamily: fonts.medium, fontSize: 14, color: c.muted, textAlign: 'center' },
}));
