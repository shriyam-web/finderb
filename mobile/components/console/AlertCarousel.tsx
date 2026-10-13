import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { createConsoleStyles } from './kit';

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

export type AlertSlide = {
  key: string;
  tone: AlertTone;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
};

const ROTATE_MS = 6000;

/** Account alerts that rotate on their own, like the website dashboard banners; swipe or tap a dot to jump. */
export function AlertCarousel({ slides }: { slides: AlertSlide[] }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const list = useRef<FlatList<AlertSlide>>(null);
  const shown = useRef(0);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [pausedAt, setPausedAt] = useState(0);
  const count = slides.length;
  const active = count ? Math.min(index, count - 1) : 0;

  useEffect(() => {
    if (count < 2 || !width) return;
    const timer = setInterval(() => {
      const next = (shown.current + 1) % count;
      shown.current = next;
      setIndex(next);
      list.current?.scrollToOffset({ offset: next * width, animated: true });
    }, ROTATE_MS);
    return () => clearInterval(timer);
  }, [count, width, pausedAt]);

  if (!count) return null;

  const palette = (tone: AlertTone) =>
    ({
      danger: { wash: c.dangerSoft, ink: c.danger },
      warning: { wash: c.warningSoft, ink: c.warning },
      info: { wash: c.primarySoft, ink: c.accent },
      success: { wash: c.successSoft, ink: c.success },
    })[tone];

  const onSettle = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    const settled = Math.round(event.nativeEvent.contentOffset.x / width);
    shown.current = settled;
    setIndex(settled);
  };

  const jump = (next: number) => {
    shown.current = next;
    setIndex(next);
    setPausedAt((n) => n + 1);
    list.current?.scrollToOffset({ offset: next * width, animated: true });
  };

  return (
    <View
      onLayout={(event: LayoutChangeEvent) => setWidth(Math.round(event.nativeEvent.layout.width))}
      accessibilityLabel="Account alerts"
    >
      {width ? (
        <FlatList
          ref={list}
          data={slides}
          keyExtractor={(slide) => slide.key}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScrollBeginDrag={() => setPausedAt((n) => n + 1)}
          onMomentumScrollEnd={onSettle}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          renderItem={({ item, index: i }) => {
            const tone = palette(item.tone);
            return (
              <View style={{ width }}>
                <Pressable
                  onPress={item.onPress}
                  style={({ pressed }) => [styles.slide, { backgroundColor: tone.wash }, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Alert ${i + 1} of ${count}. ${item.title}. ${item.body}`}
                >
                  <View style={styles.slideTop}>
                    <View style={[styles.icon, { backgroundColor: c.card }]}>
                      <Ionicons name={item.icon} size={18} color={tone.ink} />
                    </View>
                    <View style={styles.copy}>
                      <Text style={[styles.title, { color: c.ink }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={styles.body} numberOfLines={2}>
                        {item.body}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.ctaRow}>
                    <Text style={[styles.cta, { color: tone.ink }]}>{item.cta}</Text>
                    <Ionicons name="arrow-forward" size={15} color={tone.ink} />
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.placeholder} />
      )}
      {count > 1 ? (
        <View style={styles.dots}>
          {slides.map((slide, i) => (
            <Pressable
              key={slide.key}
              onPress={() => jump(i)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Show alert ${i + 1}`}
              style={[styles.dot, i === active && styles.dotOn]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  slide: { minHeight: 132, borderRadius: 14, padding: 16, justifyContent: 'space-between', gap: 12 },
  pressed: { opacity: 0.85 },
  slideTop: { flexDirection: 'row', gap: 12 },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  title: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 21 },
  body: { marginTop: 3, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.body },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 48 },
  cta: { fontFamily: fonts.semiBold, fontSize: 13.5 },
  placeholder: { height: 132 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.lineStrong },
  dotOn: { width: 18, backgroundColor: c.primary },
}));
