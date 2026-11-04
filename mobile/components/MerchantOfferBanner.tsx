import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/typography';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  headline: string;
  detail: string;
  label: string;
  compact?: boolean;
};

const SAVING_EMOJIS = ['💰', '🏷️', '💸', '✨', '%', '💵'] as const;
const MAX_VISIBLE = 2;
const LANE_WIDTH = 72;

type MotionPattern = 'sway' | 'zigzag' | 'driftLeft' | 'driftRight' | 'popRise';

type Floater = {
  id: number;
  emoji: string;
  x: number;
  drift: number;
  duration: number;
  size: number;
  pattern: MotionPattern;
  rotateAmt: number;
  rise: number;
};

const PATTERNS: MotionPattern[] = [
  'sway',
  'zigzag',
  'driftLeft',
  'driftRight',
  'popRise',
];

function splitDeal(headline: string): { amount: string; suffix: string | null } {
  const trimmed = headline.trim();
  const match = trimmed.match(/^(.*?)(\s+off)$/i);
  if (match) {
    return { amount: match[1].trim(), suffix: 'off' };
  }
  return { amount: trimmed, suffix: null };
}

function pickPattern(): MotionPattern {
  return PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
}

function motionFor(
  pattern: MotionPattern,
  progress: Animated.Value,
  item: Floater,
) {
  const translateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [32, -item.rise],
  });

  let translateX: Animated.AnimatedInterpolation<string | number>;
  let rotate: Animated.AnimatedInterpolation<string | number>;
  let scale: Animated.AnimatedInterpolation<string | number>;
  let opacity: Animated.AnimatedInterpolation<string | number>;

  // Shared: fade in quick, stay solid most of the flight, soft fade at the end.
  const solidOpacity = progress.interpolate({
    inputRange: [0, 0.06, 0.18, 0.78, 0.92, 1],
    outputRange: [0, 0.85, 1, 1, 0.55, 0],
  });

  switch (pattern) {
    case 'zigzag':
      translateX = progress.interpolate({
        inputRange: [0, 0.18, 0.36, 0.54, 0.72, 0.9, 1],
        outputRange: [
          0,
          item.drift,
          -item.drift * 0.85,
          item.drift * 0.95,
          -item.drift * 0.55,
          item.drift * 0.35,
          item.drift * 0.1,
        ],
      });
      rotate = progress.interpolate({
        inputRange: [0, 0.2, 0.4, 0.6, 0.8, 1],
        outputRange: [
          '0deg',
          `${item.rotateAmt}deg`,
          `${-item.rotateAmt}deg`,
          `${item.rotateAmt * 0.7}deg`,
          `${-item.rotateAmt * 0.45}deg`,
          '0deg',
        ],
      });
      scale = progress.interpolate({
        inputRange: [0, 0.12, 0.5, 1],
        outputRange: [0.7, 1.08, 1.02, 0.92],
      });
      opacity = solidOpacity;
      break;

    case 'driftLeft':
      translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [10, -Math.abs(item.drift) - 10],
      });
      rotate = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['8deg', '0deg', `-${item.rotateAmt}deg`],
      });
      scale = progress.interpolate({
        inputRange: [0, 0.15, 0.55, 1],
        outputRange: [0.75, 1.1, 1.02, 0.9],
      });
      opacity = solidOpacity;
      break;

    case 'driftRight':
      translateX = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [-10, Math.abs(item.drift) + 12],
      });
      rotate = progress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-8deg', '2deg', `${item.rotateAmt}deg`],
      });
      scale = progress.interpolate({
        inputRange: [0, 0.15, 0.55, 1],
        outputRange: [0.75, 1.1, 1.02, 0.9],
      });
      opacity = solidOpacity;
      break;

    case 'popRise':
      translateX = progress.interpolate({
        inputRange: [0, 0.35, 0.7, 1],
        outputRange: [0, item.drift * 0.55, item.drift * 0.2, item.drift * 0.05],
      });
      rotate = progress.interpolate({
        inputRange: [0, 0.25, 0.6, 1],
        outputRange: [
          '0deg',
          `${item.rotateAmt * 0.55}deg`,
          `${-item.rotateAmt * 0.3}deg`,
          '0deg',
        ],
      });
      scale = progress.interpolate({
        inputRange: [0, 0.1, 0.22, 0.55, 1],
        outputRange: [0.35, 1.22, 1.05, 1, 0.88],
      });
      opacity = solidOpacity;
      break;

    case 'sway':
    default:
      translateX = progress.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [
          0,
          item.drift,
          -item.drift * 0.65,
          item.drift * 0.45,
          item.drift * 0.1,
        ],
      });
      rotate = progress.interpolate({
        inputRange: [0, 0.3, 0.6, 0.85, 1],
        outputRange: [
          `-${item.rotateAmt * 0.35}deg`,
          `${item.rotateAmt}deg`,
          `-${item.rotateAmt * 0.55}deg`,
          `${item.rotateAmt * 0.35}deg`,
          '0deg',
        ],
      });
      scale = progress.interpolate({
        inputRange: [0, 0.12, 0.45, 1],
        outputRange: [0.65, 1.12, 1.02, 0.9],
      });
      opacity = solidOpacity;
      break;
  }

  return { translateX, translateY, rotate, scale, opacity };
}

function LiveSavingEmoji({
  item,
  onDone,
}: {
  item: Floater;
  onDone: (id: number) => void;
}) {
  const styles = useStyles();
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const easing =
      item.pattern === 'popRise'
        ? Easing.out(Easing.cubic)
        : item.pattern === 'zigzag'
          ? Easing.inOut(Easing.sin)
          : Easing.inOut(Easing.quad);

    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: item.duration,
      easing,
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished) onDone(item.id);
    });
    return () => anim.stop();
  }, [item.duration, item.id, item.pattern, onDone, progress]);

  const { translateX, translateY, rotate, scale, opacity } = motionFor(
    item.pattern,
    progress,
    item,
  );

  return (
    <Animated.Text
      pointerEvents="none"
      style={[
        styles.emoji,
        {
          left: item.x,
          fontSize: item.size,
          opacity,
          transform: [{ translateX }, { translateY }, { rotate }, { scale }],
        },
      ]}
    >
      {item.emoji}
    </Animated.Text>
  );
}

function SavingEmojiRain({ compact = false }: { compact?: boolean }) {
  const styles = useStyles();
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const nextId = useRef(0);
  const emojiIndex = useRef(0);
  const activeCount = useRef(0);
  const mounted = useRef(true);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const removeFloater = useCallback((id: number) => {
    activeCount.current = Math.max(0, activeCount.current - 1);
    setFloaters((prev) => prev.filter((f) => f.id !== id));
  }, []);

  useEffect(() => {
    mounted.current = true;

    const clearTimers = () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };

    const spawnOne = () => {
      if (!mounted.current) return;
      if (activeCount.current >= MAX_VISIBLE) return;

      const id = nextId.current++;
      const emoji = SAVING_EMOJIS[emojiIndex.current % SAVING_EMOJIS.length];
      emojiIndex.current += 1;
      activeCount.current += 1;

      const pattern = pickPattern();
      setFloaters((prev) => [
        ...prev,
        {
          id,
          emoji,
          x: 2 + Math.random() * (compact ? 16 : 30),
          drift: 8 + Math.random() * 14,
          duration:
            pattern === 'popRise'
              ? 3800 + Math.random() * 900
              : pattern === 'zigzag'
                ? 4800 + Math.random() * 1200
                : 4200 + Math.random() * 1600,
          size: compact ? (emoji === '%' ? 13 : 14) : emoji === '%' ? 24 : 24 + Math.floor(Math.random() * 6),
          pattern,
          rotateAmt: 10 + Math.random() * 12,
          rise: compact ? 36 + Math.random() * 10 : 100 + Math.random() * 24,
        },
      ]);
    };

    const scheduleNext = () => {
      if (!mounted.current) return;
      // Slower cadence so each float can be seen fully.
      const wait = 900 + Math.random() * 1800;
      const t = setTimeout(() => {
        spawnOne();
        if (Math.random() > 0.55 && activeCount.current < MAX_VISIBLE) {
          const burst = setTimeout(spawnOne, 400 + Math.random() * 500);
          timers.current.push(burst);
        }
        scheduleNext();
      }, wait);
      timers.current.push(t);
    };

    const kick = setTimeout(() => {
      spawnOne();
      const second = setTimeout(spawnOne, 500 + Math.random() * 400);
      timers.current.push(second);
      scheduleNext();
    }, 250);
    timers.current.push(kick);

    return () => {
      mounted.current = false;
      clearTimers();
    };
  }, [compact]);

  return (
    <View style={[styles.symbols, compact && styles.symbolsCompact]} pointerEvents="none">
      {floaters.map((item) => (
        <LiveSavingEmoji key={item.id} item={item} onDone={removeFloater} />
      ))}
    </View>
  );
}

/** White coupon — FinderB Savings + live floating saving emojis. */
export function MerchantOfferBanner({ headline, detail, compact = false }: Props) {
  const styles = useStyles();
  const { amount, suffix } = splitDeal(headline);
  const note = detail?.trim() || '';

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.saveCol, compact && styles.saveColCompact]}>
        <Text style={[styles.saveText, compact && styles.saveTextCompact]}>FinderB{'\n'}Savings</Text>
      </View>

      <View style={[styles.body, compact && styles.bodyCompact]}>
        <View style={styles.dealRow}>
          <Text style={[styles.amount, compact && styles.amountCompact]}>{amount}</Text>
          {suffix ? <Text style={[styles.suffix, compact && styles.suffixCompact]}>{suffix}</Text> : null}
        </View>
        {note ? (
          <Text style={[styles.detail, compact && styles.detailCompact]} numberOfLines={compact ? 1 : 2}>
            {note}
          </Text>
        ) : null}
      </View>

      <SavingEmojiRain compact={compact} />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    marginTop: 10,
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderStyle: 'dashed',
    position: 'relative',
    minHeight: 92,
  },
  saveCol: {
    width: 68,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.borderStrong,
    zIndex: 1,
  },
  saveText: {
    fontFamily: fonts.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 13,
    paddingLeft: 14,
    paddingRight: LANE_WIDTH + 8,
    gap: 4,
    zIndex: 1,
  },
  dealRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  amount: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  suffix: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  detail: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  wrapCompact: {
    marginTop: 4,
    minHeight: 0,
    borderRadius: 8,
  },
  saveColCompact: {
    width: 52,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  saveTextCompact: {
    fontSize: 8,
    lineHeight: 10,
  },
  bodyCompact: {
    paddingVertical: 6,
    paddingLeft: 8,
    paddingRight: 32,
    gap: 1,
  },
  amountCompact: {
    fontSize: 14,
    lineHeight: 17,
  },
  suffixCompact: {
    fontSize: 11,
  },
  detailCompact: {
    fontSize: 10,
    lineHeight: 13,
  },
  symbols: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: LANE_WIDTH,
    overflow: 'hidden',
  },
  symbolsCompact: {
    width: 28,
  },
  emoji: {
    position: 'absolute',
    bottom: 4,
    color: colors.ink,
  },
}));
