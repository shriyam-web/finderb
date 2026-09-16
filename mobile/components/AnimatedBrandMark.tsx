import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { FinderBLogo } from './BrandMark';
import { fonts } from '../constants/typography';
import { createThemedStyles } from '../hooks/useThemedStyles';

const IDLE_MS = 14000;
const HOLD_MS = 5200;
const WORD_WIDTH = 76;

/** Soft ease — less snappy than cubic out */
const softInOut = Easing.bezier(0.4, 0.0, 0.2, 1);
const softOut = Easing.bezier(0.22, 1, 0.36, 1);

/**
 * FB mark mostly alone. Soft unfurl of FinderB from the logo edge,
 * then a gentle tuck-back — never aggressive.
 */
export function AnimatedBrandMark({
  wordColor = '#FFFFFF',
}: {
  /** Wordmark color — white on climate hero, heading ink on light sticky canvas. */
  wordColor?: string;
}) {
  const styles = useStyles();
  const progress = useRef(new Animated.Value(0)).current;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const schedule = (fn: () => void, ms: number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
  };

  useEffect(() => {
    let cancelled = false;

    const hide = () => {
      if (cancelled) return;
      loopRef.current = Animated.timing(progress, {
        toValue: 0,
        duration: 720,
        easing: softInOut,
        useNativeDriver: false,
      });
      loopRef.current.start(({ finished }) => {
        if (!finished || cancelled) return;
        schedule(reveal, IDLE_MS);
      });
    };

    const reveal = () => {
      if (cancelled) return;
      loopRef.current = Animated.timing(progress, {
        toValue: 1,
        duration: 880,
        easing: softOut,
        useNativeDriver: false,
      });
      loopRef.current.start(({ finished }) => {
        if (!finished || cancelled) return;
        schedule(hide, HOLD_MS);
      });
    };

    schedule(reveal, 4500);

    return () => {
      cancelled = true;
      clearTimers();
      loopRef.current?.stop();
      progress.stopAnimation();
    };
  }, [progress]);

  const logoX = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -3],
  });

  const wordWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, WORD_WIDTH],
  });

  const wordOpacity = progress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.55, 1],
  });

  const wordShift = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [-6, 0],
  });

  return (
    <View style={styles.wrap} pointerEvents="none">
      <Animated.View style={[styles.logoSlot, { transform: [{ translateX: logoX }] }]}>
        <FinderBLogo size={32} />
      </Animated.View>
      <Animated.View
        style={[
          styles.wordClip,
          {
            width: wordWidth,
            opacity: wordOpacity,
            transform: [{ translateX: wordShift }],
          },
        ]}
      >
        <Text style={[styles.word, { color: wordColor }]} numberOfLines={1}>
          FinderB
        </Text>
      </Animated.View>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSlot: {
    width: 32,
    height: 32,
    overflow: 'visible',
  },
  wordClip: {
    overflow: 'hidden',
    marginLeft: 3,
    height: 28,
    justifyContent: 'center',
  },
  word: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.25,
    width: WORD_WIDTH,
  },
}));
