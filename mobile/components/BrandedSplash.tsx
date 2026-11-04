import { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FinderBLogo } from './BrandMark';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

const RUNNER = '#215481';

type Props = {
  mode?: 'intro' | 'boot';
  message?: string;
};

/** Quiet opening screen: mark, wordmark, and a loader clear of the bottom edge. */
export function BrandedSplash({
  mode = 'boot',
  message = 'Preparing your local guide',
}: Props) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useStyles();
  const enter = useRef(new Animated.Value(0)).current;
  const run = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 480,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const loop = Animated.loop(
      Animated.timing(run, {
        toValue: 1,
        duration: 1200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [enter, run]);

  const runnerX = run.interpolate({ inputRange: [0, 1], outputRange: [-48, 132] });

  return (
    <View style={styles.root}>
      <StatusBar style={colors.statusBarStyle} />
      <Animated.View
        style={[
          styles.stage,
          {
            opacity: enter,
            transform: [
              {
                translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
              },
            ],
          },
        ]}
      >
        <FinderBLogo size={96} />
        <Text style={styles.word}>{'FinderB '}</Text>
        <Text style={styles.tag}>{'Trusted locals near you '}</Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.foot,
          { opacity: enter, marginBottom: Math.max(insets.bottom, 12) + 72 },
        ]}
      >
        <View style={styles.track}>
          <Animated.View style={[styles.runner, { transform: [{ translateX: runnerX }] }]} />
        </View>
        <Text style={styles.loading}>
          {`${mode === 'boot' ? message : 'Curating nearby places'} `}
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.canvas,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  stage: {
    alignItems: 'center' as const,
    marginTop: -36,
  },
  word: {
    marginTop: 18,
    fontFamily: fonts.extraBold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1.2,
    paddingHorizontal: 6,
    color: colors.heading,
  },
  tag: {
    marginTop: 8,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 8,
    color: colors.textMuted,
  },
  foot: {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center' as const,
    gap: 12,
  },
  track: {
    width: 132,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden' as const,
    backgroundColor: colors.border,
  },
  runner: {
    width: 48,
    height: 3,
    borderRadius: 2,
    backgroundColor: RUNNER,
  },
  loading: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 8,
    color: colors.textMuted,
  },
}));
