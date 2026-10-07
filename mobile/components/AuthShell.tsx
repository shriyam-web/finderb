import { ReactNode, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from './BrandMark';
import { fonts } from '../constants/typography';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { goBackOrHome } from '../lib/navigation';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer: ReactNode;
  hideBack?: boolean;
  /** Content without the card and accent bar. */
  plain?: boolean;
  topRight?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer, hideBack, plain, topRight }: Props) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const bottomInset = useBottomInset(16);
  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(rise, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fade, rise]);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={[...gradients.warmWash]}
        locations={[0, 0.45, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topBar}>
            {hideBack ? (
              <View style={topRight ? styles.topRight : styles.topSpacer} />
            ) : (
              <Pressable
                style={styles.backBtn}
                onPress={() => goBackOrHome(router)}
                hitSlop={8}
                accessibilityLabel="Go back"
              >
                <Ionicons name="chevron-back" size={20} color={colors.ink} />
              </Pressable>
            )}

            <View style={styles.brandRow}>
              <FinderBLogo size={26} />
              <Text style={styles.brandWord}>FinderB</Text>
            </View>

            {topRight ? <View style={styles.topRight}>{topRight}</View> : <View style={styles.topSpacer} />}
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: 12 + bottomInset },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Animated.View
              style={[
                plain ? styles.plain : styles.card,
                { opacity: fade, transform: [{ translateY: rise }] },
              ]}
            >
              {plain ? null : <View style={styles.accentBar} />}
              <Text style={styles.title}>{title}</Text>
              {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

              <View style={styles.form}>{children}</View>

              <View style={styles.footer}>{footer}</View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.canvasWarm,
  },
  flex: { flex: 1 },
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandWord: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  topSpacer: { width: 36 },
  topRight: { width: 64, alignItems: 'flex-end' },
  plain: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  accentBar: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginBottom: 14,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  subtitle: {
    marginTop: 4,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  form: {
    marginTop: 2,
  },
  footer: {
    marginTop: 14,
    alignItems: 'center',
  },
}));
