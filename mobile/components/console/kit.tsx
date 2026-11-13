import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageStyle,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useFocusEffect, usePathname, useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { fonts } from '../../constants/typography';
import { consoleColors, useConsoleColors, type ConsoleColors } from '../../constants/consoleColors';
import { useTheme } from '../../context/ThemeContext';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { useBottomInset } from '../../hooks/useAppSafeArea';
import { FinderBLogo } from '../BrandMark';
import { setPreferredShell } from '../../lib/preferredShell';
import { openConsolePath, useConsoleBackAction } from '../../lib/consoleNav';
import { useConsoleSearch } from './ConsoleSearch';
import { MerchantSupportFab } from './MerchantSupportFab';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };
type IconName = keyof typeof Ionicons.glyphMap;

/** Like createThemedStyles, but hands the factory the console palette. */
export function createConsoleStyles<T extends NamedStyles<T>>(factory: (c: ConsoleColors) => T) {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(consoleColors(colors))), [colors]);
  };
}

export const DOCK_HEIGHT = 62;
export const HOME_HREF = '/business-console' as Href;
/** Shared links always point at the live site, even when the app talks to a local server. */
export const PUBLIC_SITE = 'https://finderb.com';

export function useDockPadding(extra = 24) {
  return DOCK_HEIGHT + useBottomInset() + extra;
}

/** Back target for screens with no history: the panel home. */
export function useConsoleBack() {
  const goBack = useConsoleBackAction();
  return () => {
    goBack('header');
  };
}

/** Back on a dock tab returns to the previous console screen, never the consumer app. */
export function useTabBack() {
  const goBack = useConsoleBackAction();
  return () => {
    goBack('header');
  };
}

const ConsoleScrollContext = createContext({ scrollTo: (_y: number) => {} });

/** Scroll the current console page body. Used when search opens a section mid-page. */
export function useConsoleScroll() {
  return useContext(ConsoleScrollContext);
}

export function ConsoleHeaderActions({ children }: { children?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {children}
      <HeaderIcon icon="menu-outline" label="More" onPress={() => openConsolePath(router, '/business-console/more')} />
    </View>
  );
}

export function HeaderIcon({
  icon,
  onPress,
  label,
  badge,
}: {
  icon: IconName;
  onPress: () => void;
  label: string;
  badge?: number;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
      accessibilityRole="button"
      accessibilityLabel={badge ? `${label}, ${badge} new` : label}
    >
      <Ionicons name={icon} size={22} color={c.ink} />
      {badge ? (
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{badge > 9 ? '9+' : badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type PageProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  hideBack?: boolean;
  /** Replaces the back control — used on the Home dashboard for the menu. */
  left?: ReactNode;
  /** Home dashboard: FinderB mark + “Business”, hamburger on the left. */
  brand?: boolean;
  right?: ReactNode;
  /** Drawn over the scroll body (Home search results). */
  overlay?: ReactNode;
  /** Hide the console-wide search control. Forms hide it automatically. */
  search?: boolean;
  children: ReactNode;
  docked?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  scroll?: boolean;
  bodyStyle?: StyleProp<ViewStyle>;
  /** Forms sit on the card colour so underlined fields read cleanly. */
  form?: boolean;
  /** Changing this jumps the page back to the top. */
  scrollToken?: string | number;
};

const GLOW_HEIGHT = 420;
const glowFrame: ViewStyle = { position: 'absolute', top: 0, left: 0, right: 0, height: GLOW_HEIGHT };

/** The website dashboard's backdrop: a warm amber wash top-left and a faint navy one top-right. */
function PageGlow() {
  const c = useConsoleColors();
  if (c.isDark) return null;
  return (
    <Svg pointerEvents="none" style={glowFrame} width="100%" height={GLOW_HEIGHT}>
      <Defs>
        <RadialGradient id="amber" cx="15%" cy="-8%" rx="80%" ry="50%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#F9B864" stopOpacity={0.16} />
          <Stop offset="1" stopColor="#F9B864" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id="navy" cx="95%" cy="5%" rx="55%" ry="45%" gradientUnits="objectBoundingBox">
          <Stop offset="0" stopColor="#71717A" stopOpacity={0.08} />
          <Stop offset="1" stopColor="#71717A" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#amber)" />
      <Rect width="100%" height="100%" fill="url(#navy)" />
    </Svg>
  );
}

function RefreshBurst() {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const spin = useRef(new Animated.Value(0)).current;
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 780,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    const bounceLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bounce, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    bounceLoop.start();
    return () => {
      spinLoop.stop();
      bounceLoop.stop();
    };
  }, [bounce, spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scale = bounce.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.12] });

  return (
    <View pointerEvents="none" style={styles.refreshHud}>
      <Animated.View style={[styles.refreshOrb, { transform: [{ scale }] }]}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons name="sync" size={22} color={c.brand} />
        </Animated.View>
      </Animated.View>
      <View style={styles.refreshCopy}>
        <Text style={styles.refreshTitle}>Refreshing</Text>
        <Text style={styles.refreshBody}>Pulling the latest numbers…</Text>
      </View>
    </View>
  );
}

/** Business home: “Business” opens a switch onto the customer side. Search stays an icon until used. */
function ShellSwitch() {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const goUser = () => {
    setOpen(false);
    void setPreferredShell('user').then(() => {
      router.replace('/(tabs)/home' as Href);
    });
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        style={({ pressed }) => [styles.shellSwitch, pressed && styles.headerIconPressed]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel="Business. Switch to the user side"
      >
        <Text style={styles.brandWord}>Business</Text>
        <Ionicons name="chevron-down" size={14} color={c.muted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.shellScrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setOpen(false)}
            accessibilityLabel="Close switcher"
          />
          <View style={[styles.shellMenu, { top: insets.top + 50, left: 52 }]}>
            <Pressable
              onPress={() => setOpen(false)}
              style={({ pressed }) => [styles.shellOption, pressed && styles.headerIconPressed]}
              accessibilityRole="button"
              accessibilityState={{ selected: true }}
            >
              <Ionicons name="storefront-outline" size={16} color={c.ink} />
              <Text style={styles.shellOptionText}>Business</Text>
              <Ionicons name="checkmark" size={16} color={c.brand} />
            </Pressable>
            <Pressable
              onPress={goUser}
              style={({ pressed }) => [styles.shellOption, pressed && styles.headerIconPressed]}
              accessibilityRole="button"
              accessibilityLabel="Switch to the user side"
            >
              <Ionicons name="person-outline" size={16} color={c.ink} />
              <Text style={styles.shellOptionText}>User</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

/** Every console screen: the same header (back, title, actions), scroll body and optional sticky footer. */
function SubscriptionStrip({ onPress }: { onPress: () => void }) {
  const styles = useKitStyles();
  const sweep = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const shine = Animated.loop(
      Animated.sequence([
        Animated.timing(sweep, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(650),
        Animated.timing(sweep, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(800),
      ]),
    );
    shine.start();
    return () => shine.stop();
  }, [sweep]);

  const translateX = sweep.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, Math.max(width, 80)],
  });

  return (
    <Pressable
      onPress={onPress}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      style={styles.subStrip}
      accessibilityRole="button"
      accessibilityLabel="You don't have any active subscription. Open plans."
    >
      <Text style={styles.subStripText}>You don't have any active subscription.</Text>
      <Animated.View pointerEvents="none" style={[styles.subShine, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.72)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.flex}
        />
      </Animated.View>
    </Pressable>
  );
}

export function ConsolePage({
  title,
  subtitle,
  onBack,
  hideBack,
  left,
  brand,
  right,
  overlay,
  children,
  docked,
  refreshing,
  onRefresh,
  footer,
  scroll = true,
  bodyStyle,
  form,
  search = true,
  scrollToken,
}: PageProps) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { overview, refresh: refreshConsole, refreshing: consoleRefreshing } = useMerchantConsole();
  const goBack = useConsoleBack();
  const dockPad = useDockPadding();
  const bottomInset = useBottomInset();
  const showSearch = Boolean(overview) && search && !form;
  const searchCtl = useConsoleSearch(overview, { embedQuery: true });
  const footerLift = (docked ? DOCK_HEIGHT : 0) + bottomInset + 12;
  const bottomPad = docked ? dockPad + (footer ? 72 : 0) : footer ? 24 : bottomInset + 28;
  const scrollRef = useRef<ScrollView>(null);
  const scrollTo = useCallback((y: number) => {
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 12), animated: true });
  }, []);
  const onPlan = /\/(plan|subscription)\b/.test(pathname || '');
  const showSubStrip = Boolean(overview && !overview.subscription.isActive && !onPlan);

  useFocusEffect(
    useCallback(() => {
      const jump = () => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
      jump();
      const frame = requestAnimationFrame(jump);
      const later = setTimeout(jump, 50);
      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(later);
      };
    }, []),
  );

  useEffect(() => {
    if (scrollToken == null) return;
    const jump = () => scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    jump();
    const frame = requestAnimationFrame(jump);
    const later = setTimeout(jump, 60);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(later);
    };
  }, [scrollToken]);

  const pullRefresh = onRefresh ?? (() => { void refreshConsole(); });
  const pullRefreshing = onRefresh ? Boolean(refreshing) : consoleRefreshing;
  const body = scroll ? (
    <ScrollView
      key={scrollToken == null ? 'console-scroll' : `console-scroll-${scrollToken}`}
      ref={scrollRef}
      contentOffset={{ x: 0, y: 0 }}
      alwaysBounceVertical
      contentContainerStyle={[styles.body, form && styles.formBody, { paddingBottom: bottomPad, flexGrow: 1 }, bodyStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={pullRefreshing}
          onRefresh={pullRefresh}
          tintColor={c.brand}
          colors={[c.brand, c.ink, c.success]}
          progressBackgroundColor={c.card}
          title="Refreshing…"
          titleColor={c.muted}
        />
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: docked ? dockPad : 0 }]}>{children}</View>
  );

  return (
    <ConsoleScrollContext.Provider value={{ scrollTo }}>
    <KeyboardAvoidingView style={[styles.page, form && styles.formPage]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          {left ? (
            left
          ) : brand ? (
            <HeaderIcon
              icon="menu-outline"
              label="More"
              onPress={() => openConsolePath(router, '/business-console/more')}
            />
          ) : hideBack ? (
            <View style={{ width: 6 }} />
          ) : (
            <Pressable
              onPress={onBack ?? goBack}
              hitSlop={6}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="arrow-back" size={22} color={c.ink} />
            </Pressable>
          )}
          {brand ? (
            <View style={styles.brandLockup} accessibilityRole="header" accessibilityLabel="FinderB Business">
              <FinderBLogo size={26} />
              <ShellSwitch />
            </View>
          ) : (
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {title}
              </Text>
              {subtitle ? (
                <Text style={styles.headerSub} numberOfLines={1}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
          )}
          {showSearch || right ? (
            <View style={[styles.headerRight, brand && styles.headerRightGrow]}>
              {showSearch ? searchCtl.icon : null}
              {right}
            </View>
          ) : null}
        </View>
      </View>
      {showSubStrip ? <SubscriptionStrip onPress={() => router.push('/business-console/plan' as Href)} /> : null}
      <View style={[styles.flex, styles.bodyWrap]}>
        {form ? null : <PageGlow />}
        {pullRefreshing ? <RefreshBurst /> : null}
        {body}
        {showSearch ? searchCtl.overlay : null}
        {overlay}
      </View>
      {footer ? <View style={[styles.footer, { paddingBottom: footerLift }]}>{footer}</View> : null}
      {showSearch && searchCtl.open ? null : (
        <MerchantSupportFab
          bottomOffset={(docked ? DOCK_HEIGHT : 0) + (footer ? 64 : 0) + bottomInset + 16}
        />
      )}
    </KeyboardAvoidingView>
    </ConsoleScrollContext.Provider>
  );
}

export function Section({
  title,
  action,
  onAction,
  children,
  style,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useKitStyles();
  return (
    <View style={[styles.section, style]}>
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && onAction ? (
          <Pressable onPress={onAction} hitSlop={8} accessibilityRole="button">
            <Text style={styles.sectionAction}>{action}</Text>
          </Pressable>
        ) : null}
      </View>
      {children}
    </View>
  );
}

export function Panel({ children, style, flush }: { children: ReactNode; style?: StyleProp<ViewStyle>; flush?: boolean }) {
  const styles = useKitStyles();
  return <View style={[styles.panel, flush && styles.panelFlush, style]}>{children}</View>;
}

type BtnTone = 'primary' | 'outline' | 'text' | 'danger' | 'success';

export function Btn({
  label,
  onPress,
  tone = 'primary',
  icon,
  busy,
  disabled,
  small,
  style,
}: {
  label: string;
  onPress: () => void;
  tone?: BtnTone;
  icon?: IconName;
  busy?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const ink =
    tone === 'success'
      ? '#FFFFFF'
      : tone === 'primary'
        ? c.primaryInk
        : tone === 'danger'
          ? c.danger
          : tone === 'text'
            ? c.accent
            : c.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: Boolean(disabled || busy), busy: Boolean(busy) }}
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        tone === 'primary' && styles.btnPrimary,
        tone === 'success' && styles.btnSuccess,
        tone === 'outline' && styles.btnOutline,
        tone === 'danger' && styles.btnDanger,
        tone === 'text' && styles.btnText,
        (disabled || busy) && styles.btnDisabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator size="small" color={ink} />
      ) : icon ? (
        <Ionicons name={icon} size={small ? 16 : 18} color={ink} />
      ) : null}
      <Text style={[styles.btnLabel, small && styles.btnLabelSmall, { color: ink }]}>{label}</Text>
    </Pressable>
  );
}

type FieldProps = TextInputProps & {
  label: string;
  hint?: string;
  error?: string;
  counter?: string;
  prefix?: string;
  boxed?: boolean;
};

/** Underlined text field: label on top, a single bottom rule that thickens on focus. */
export function Field({ label, hint, error, counter, prefix, boxed, style, multiline, onFocus, onBlur, editable, ...input }: FieldProps) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const [focused, setFocused] = useState(false);
  const locked = editable === false;
  const ruleColor = error ? c.danger : focused ? c.primary : c.lineStrong;
  return (
    <View style={[styles.field, boxed && styles.fieldBoxed, boxed && focused && { borderColor: c.primary }, locked && { opacity: 0.7 }]}>
      <Text style={[styles.fieldLabel, focused && { color: c.primary }, error ? { color: c.danger } : null]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldLine,
          multiline && styles.fieldLineMulti,
          boxed ? styles.fieldLineBoxed : { borderBottomColor: ruleColor, borderBottomWidth: focused || error ? 2 : 1 },
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={c.faint}
          selectionColor={c.primary}
          cursorColor={c.primary}
          multiline={multiline}
          editable={editable}
          textAlignVertical={multiline ? 'top' : 'center'}
          underlineColorAndroid="transparent"
          style={[styles.input, multiline && styles.inputMulti, style]}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...input}
        />
      </View>
      {error || hint || counter ? (
        <View style={styles.fieldFoot}>
          <Text style={[styles.fieldHint, error ? { color: c.danger } : null]}>{error ?? hint ?? ''}</Text>
          {counter ? <Text style={styles.fieldCounter}>{counter}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

/** A tappable underlined value, styled like Field, for pickers. */
export function PickField({
  label,
  value,
  placeholder,
  onPress,
  icon = 'chevron-down',
  hint,
}: {
  label: string;
  value?: string;
  placeholder?: string;
  onPress: () => void;
  icon?: IconName;
  hint?: string;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
        style={({ pressed }) => [styles.fieldLine, styles.pickLine, pressed && styles.pickPressed]}
      >
        <Text style={[styles.pickValue, !value && { color: c.faint }]} numberOfLines={1}>
          {value || placeholder || 'Select'}
        </Text>
        <Ionicons name={icon} size={18} color={c.muted} />
      </Pressable>
      {hint ? <Text style={styles.fieldHint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({
  label,
  active,
  onPress,
  icon,
  count,
  small,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
  small?: boolean;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: Boolean(active) } : undefined}
      style={({ pressed }) => [
        styles.chip,
        small && styles.chipSmall,
        active && styles.chipActive,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={small ? 12 : 14} color={active ? c.primary : c.body} /> : null}
      <Text style={[styles.chipText, small && styles.chipTextSmall, active && styles.chipTextActive]}>{label}</Text>
      {count != null ? (
        <Text style={[styles.chipCount, small && styles.chipCountSmall, active && styles.chipTextActive]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

export type TagTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

export function Tag({
  label,
  tone = 'neutral',
  icon,
  style,
}: {
  label: string;
  tone?: TagTone;
  icon?: IconName;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const palette = {
    success: [c.successSoft, c.success],
    danger: [c.dangerSoft, c.danger],
    warning: [c.warningSoft, c.warning],
    neutral: [c.sunken, c.body],
    info: [c.primarySoft, c.accent],
  }[tone];
  return (
    <View style={[styles.tag, { backgroundColor: palette[0] }, style]}>
      {icon ? <Ionicons name={icon} size={12} color={palette[1]} /> : null}
      <Text style={[styles.tagText, { color: palette[1] }]}>{label}</Text>
    </View>
  );
}

type SheetAction = { label: string; onPress: () => void; busy?: boolean; disabled?: boolean };

/** Full-screen form: close on the left, title, and the save action on the right. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  action,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  action?: SheetAction;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const bottomInset = useBottomInset();
  const scrollRef = useRef<ScrollView>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      show.remove();
      hide.remove();
      setKeyboardHeight(0);
    };
  }, [visible]);
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      presentationStyle={Platform.OS === 'ios' ? 'fullScreen' : undefined}
    >
      <StatusBar barStyle={c.isDark ? 'light-content' : 'dark-content'} />
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={onClose}
              hitSlop={6}
              style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={24} color={c.ink} />
            </Pressable>
            <Text style={[styles.headerTitle, styles.flex]} numberOfLines={1}>
              {title}
            </Text>
            {action ? (
              <Pressable
                onPress={action.onPress}
                disabled={action.disabled || action.busy}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.sheetAction,
                  (action.disabled || action.busy) && styles.btnDisabled,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                {action.busy ? (
                  <ActivityIndicator size="small" color={c.primaryInk} />
                ) : (
                  <Text style={styles.sheetActionText}>{action.label}</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        </View>
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[
            styles.sheetBody,
            { paddingBottom: 48 + keyboardHeight + (footer ? 28 : 0) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
        {footer ? <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

export type MenuItem = { label: string; icon: IconName; onPress: () => void; tone?: 'danger'; disabled?: boolean };

/** Small bottom menu for quick choices (photo actions and the like). */
export function Menu({
  visible,
  title,
  items,
  onClose,
}: {
  visible: boolean;
  title?: string;
  items: MenuItem[];
  onClose: () => void;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const bottomInset = useBottomInset();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.menuRoot}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.menu, { paddingBottom: bottomInset + 8 }]}>
          {title ? <Text style={styles.menuTitle}>{title}</Text> : null}
          {items.map((item) => (
            <Pressable
              key={item.label}
              onPress={() => {
                onClose();
                item.onPress();
              }}
              disabled={item.disabled}
              accessibilityRole="button"
              style={({ pressed }) => [styles.menuItem, item.disabled && styles.btnDisabled, pressed && styles.rowPressed]}
            >
              <Ionicons name={item.icon} size={20} color={item.tone === 'danger' ? c.danger : c.body} />
              <Text style={[styles.menuLabel, item.tone === 'danger' && { color: c.danger }]}>{item.label}</Text>
            </Pressable>
          ))}
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            style={({ pressed }) => [styles.menuItem, styles.menuCancel, pressed && styles.rowPressed]}
          >
            <Text style={[styles.menuLabel, styles.menuCancelText]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function Empty({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  return (
    <View style={styles.empty}>
      <View style={styles.emptyMark}>
        <Ionicons name={icon} size={24} color={c.accent} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

export function Row({
  icon,
  label,
  value,
  onPress,
  tone,
  last,
  right,
  compact,
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'danger' | 'warning' | 'success';
  last?: boolean;
  right?: ReactNode;
  compact?: boolean;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const accent = tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'success' ? c.success : c.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, compact && styles.rowCompact, !last && styles.rowLine, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, compact && styles.rowIconCompact, tone ? { backgroundColor: tone === 'danger' ? c.dangerSoft : tone === 'warning' ? c.warningSoft : c.successSoft } : null]}>
        <Ionicons name={icon} size={compact ? 18 : 18} color={accent} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={[styles.rowLabel, compact && styles.rowLabelCompact]}>{label}</Text>
        {value ? (
          <Text style={[styles.rowValue, tone ? { color: accent } : null]} numberOfLines={2}>
            {value}
          </Text>
        ) : null}
      </View>
      {right}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={c.faint} /> : null}
    </Pressable>
  );
}

export function ToastHost() {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const { toast } = useMerchantConsole();
  const bottomInset = useBottomInset();
  const [shift] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!toast) return;
    shift.setValue(0);
    Animated.timing(shift, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [toast, shift]);

  if (!toast) return null;
  const icon = toast.tone === 'bad' ? 'alert-circle' : toast.tone === 'info' ? 'information-circle' : 'checkmark-circle';
  const tint = toast.tone === 'bad' ? '#F97066' : toast.tone === 'info' ? '#84ADFF' : '#47CD89';
  return (
    <Animated.View
      pointerEvents="box-none"
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        {
          bottom: DOCK_HEIGHT + bottomInset + 14,
          opacity: shift,
          transform: [{ translateY: shift.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={tint} />
      <Text style={[styles.toastText, c.isDark && { color: c.ink }]}>{toast.message}</Text>
      {toast.action ? (
        <Pressable
          onPress={toast.action.onPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={toast.action.label}
        >
          <Text style={styles.toastAction}>{toast.action.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

const useKitStyles = createConsoleStyles((c) => ({
  flex: { flex: 1 },
  bodyWrap: { position: 'relative' },
  page: { flex: 1, backgroundColor: c.page, position: 'relative', overflow: 'visible' },
  header: {
    backgroundColor: c.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.line,
  },
  subStrip: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF2A2A',
    overflow: 'hidden',
  },
  subShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 72,
  },
  subStripText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.15,
    color: '#FFFFFF',
  },
  refreshHud: {
    position: 'absolute',
    top: 10,
    left: 14,
    right: 14,
    zIndex: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    shadowColor: '#18181B',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
  refreshOrb: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.brandSoft,
  },
  refreshCopy: { flex: 1, minWidth: 0 },
  refreshTitle: { fontFamily: fonts.semiBold, fontSize: 13.5, color: c.ink },
  refreshBody: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  headerRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIconPressed: { backgroundColor: c.sunken },
  headerBadge: {
    position: 'absolute',
    top: 6,
    right: 5,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.isDark ? '#B91C1C' : c.danger,
    borderWidth: 1.5,
    borderColor: c.card,
  },
  headerBadgeText: { fontFamily: fonts.semiBold, fontSize: 9.5, color: '#FFFFFF' },
  headerCopy: { flex: 1, minWidth: 0, paddingLeft: 2 },
  headerTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  headerSub: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerRightGrow: {
    flex: 1,
    minWidth: 0,
    marginLeft: 16,
    justifyContent: 'flex-end',
    gap: 2,
  },
  brandLockup: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 2, flexShrink: 0 },
  brandWord: { fontFamily: fonts.semiBold, fontSize: 17, color: c.ink, letterSpacing: -0.3 },
  shellSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 6,
    paddingRight: 4,
    borderRadius: 8,
  },
  shellScrim: { flex: 1 },
  shellMenu: {
    position: 'absolute',
    minWidth: 196,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
    paddingVertical: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  shellOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  shellOptionText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  body: { paddingHorizontal: 14, paddingTop: 14, gap: 14 },
  formPage: { backgroundColor: c.card },
  formBody: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: c.line,
    backgroundColor: c.card,
    gap: 8,
  },
  section: { gap: 8 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  sectionAction: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  panel: {
    backgroundColor: c.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    padding: 14,
    overflow: 'visible',
  },
  panelFlush: { padding: 0, overflow: 'hidden' },
  btn: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnSmall: { minHeight: 38, borderRadius: 9, paddingHorizontal: 14, gap: 6 },
  btnPrimary: { backgroundColor: c.primary },
  btnSuccess: { backgroundColor: '#067647' },
  btnOutline: { backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong },
  btnDanger: { backgroundColor: c.dangerSoft },
  btnText: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { fontFamily: fonts.semiBold, fontSize: 15 },
  btnLabelSmall: { fontSize: 13.5 },
  pressed: { opacity: 0.8 },
  field: { gap: 2, zIndex: 2 },
  fieldBoxed: {
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: c.card,
  },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  fieldLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: c.lineStrong,
  },
  fieldLineBoxed: {
    borderBottomWidth: 0,
  },
  fieldLineMulti: { alignItems: 'flex-start' },
  prefix: { fontFamily: fonts.regular, fontSize: 16, color: c.muted, marginRight: 6 },
  input: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: c.ink, paddingVertical: 8, paddingHorizontal: 0 },
  inputMulti: { minHeight: 96, lineHeight: 22 },
  fieldFoot: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 4 },
  fieldHint: { flex: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.muted },
  fieldCounter: { fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  pickLine: { justifyContent: 'space-between', gap: 10 },
  pickPressed: { opacity: 0.7 },
  pickValue: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: c.ink, paddingVertical: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  chipSmall: { height: 28, paddingHorizontal: 10, borderRadius: 14, gap: 4 },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  chipText: { fontFamily: fonts.regular, fontSize: 13.5, color: c.body },
  chipTextSmall: { fontSize: 12 },
  chipTextActive: { color: c.primary, fontFamily: fonts.semiBold },
  chipCount: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  chipCountSmall: { fontSize: 11 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: { fontFamily: fonts.semiBold, fontSize: 11.5 },
  sheetAction: {
    minWidth: 72,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
    marginRight: 6,
  },
  sheetActionText: { fontFamily: fonts.semiBold, fontSize: 14, color: c.primaryInk },
  sheetBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40, gap: 22 },
  menuRoot: { flex: 1, justifyContent: 'flex-end' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.scrim },
  menu: {
    backgroundColor: c.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 10,
  },
  menuTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: c.ink,
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 10,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, height: 52 },
  menuLabel: { fontFamily: fonts.regular, fontSize: 15.5, color: c.ink },
  menuCancel: { justifyContent: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.line, marginTop: 4 },
  menuCancelText: { fontFamily: fonts.semiBold, color: c.muted },
  empty: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 24 },
  emptyMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
    marginBottom: 12,
  },
  emptyTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink, textAlign: 'center' },
  emptyBody: {
    marginTop: 6,
    fontFamily: fonts.regular,
    fontSize: 13.5,
    lineHeight: 20,
    color: c.muted,
    textAlign: 'center',
    maxWidth: 290,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  rowCompact: { gap: 12, paddingHorizontal: 14, paddingVertical: 9 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  rowPressed: { backgroundColor: c.sunken },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  rowIconCompact: { width: 32, height: 32, borderRadius: 10 },
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  rowLabelCompact: { fontSize: 15 },
  rowValue: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: c.isDark ? '#36312D' : '#18181B',
  },
  toastText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: '#FFFFFF' },
  toastAction: { fontFamily: fonts.semiBold, fontSize: 14, color: '#F6D58A' },
}));
