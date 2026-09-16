import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

type Props = {
  visible: boolean;
  uris: string[];
  initialIndex?: number;
  onClose: () => void;
};

/** Fullscreen photo viewer with swipe + close. */
export function PhotoLightbox({
  visible,
  uris,
  initialIndex = 0,
  onClose,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const overlayIcon = isDark ? colors.primary : colors.onDark;
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!visible) return;
    const safe = Math.max(0, Math.min(initialIndex, uris.length - 1));
    setIndex(safe);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ x: safe * SCREEN_W, animated: false });
    });
  }, [visible, initialIndex, uris.length]);

  if (!uris.length) return null;

  const goTo = (next: number) => {
    const safe = Math.max(0, Math.min(next, uris.length - 1));
    setIndex(safe);
    scrollRef.current?.scrollTo({ x: safe * SCREEN_W, animated: true });
  };

  const goPrev = () => {
    if (uris.length <= 1) return;
    goTo(index === 0 ? uris.length - 1 : index - 1);
  };

  const goNext = () => {
    if (uris.length <= 1) return;
    goTo(index === uris.length - 1 ? 0 : index + 1);
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (next !== index && next >= 0 && next < uris.length) {
      setIndex(next);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          style={styles.pager}
          contentContainerStyle={styles.pagerContent}
        >
          {uris.map((uri, i) => (
            <View key={`${uri}-${i}`} style={styles.slide}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
              />
            </View>
          ))}
        </ScrollView>

        <View
          style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) + 4 }]}
          pointerEvents="box-none"
        >
          <View style={styles.counterWrap}>
            {uris.length > 1 ? (
              <Text style={styles.counter}>
                {index + 1} / {uris.length}
              </Text>
            ) : (
              <View />
            )}
          </View>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeBtn,
              pressed && styles.closePressed,
            ]}
            accessibilityLabel="Close photo"
            hitSlop={8}
          >
            <Ionicons name="close" size={22} color={overlayIcon} />
          </Pressable>
        </View>

        {uris.length > 1 ? (
          <View
            style={[
              styles.navRow,
              {
                top: SCREEN_H / 2 - 22,
                paddingLeft: 10,
                paddingRight: 10,
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={goPrev}
              style={({ pressed }) => [
                styles.navBtn,
                pressed && styles.closePressed,
              ]}
              accessibilityLabel="Previous photo"
            >
              <Ionicons name="chevron-back" size={24} color={overlayIcon} />
            </Pressable>
            <Pressable
              onPress={goNext}
              style={({ pressed }) => [
                styles.navBtn,
                pressed && styles.closePressed,
              ]}
              accessibilityLabel="Next photo"
            >
              <Ionicons name="chevron-forward" size={24} color={overlayIcon} />
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => {
  const overlayText =
    colors.statusBarStyle === 'light' ? colors.primary : colors.onDark;

  return {
  root: {
    flex: 1,
    backgroundColor:
      colors.statusBarStyle === 'light' ? colors.canvas : colors.heroWash,
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: 'center',
  },
  slide: {
    width: SCREEN_W,
    height: SCREEN_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: SCREEN_W,
    height: SCREEN_H,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  counterWrap: {
    minWidth: 44,
  },
  counter: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: overlayText,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  closePressed: {
    opacity: 0.75,
  },
  navRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.overlay,
  },
  };
});
