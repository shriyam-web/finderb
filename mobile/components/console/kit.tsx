import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
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
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { consoleColors, useConsoleColors, type ConsoleColors } from '../../constants/consoleColors';
import { useTheme } from '../../context/ThemeContext';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { useBottomInset } from '../../hooks/useAppSafeArea';

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
  const router = useRouter();
  return () => (router.canGoBack() ? router.back() : router.replace(HOME_HREF));
}

/** Back on a dock tab returns to the Home tab. */
export function useTabBack() {
  const router = useRouter();
  return () => router.navigate(HOME_HREF);
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
  right?: ReactNode;
  children: ReactNode;
  docked?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  footer?: ReactNode;
  scroll?: boolean;
  bodyStyle?: StyleProp<ViewStyle>;
  /** Forms sit on the card colour so underlined fields read cleanly. */
  form?: boolean;
};

/** Every console screen: the same header (back, title, actions), scroll body and optional sticky footer. */
export function ConsolePage({
  title,
  subtitle,
  onBack,
  right,
  children,
  docked,
  refreshing,
  onRefresh,
  footer,
  scroll = true,
  bodyStyle,
  form,
}: PageProps) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const insets = useSafeAreaInsets();
  const goBack = useConsoleBack();
  const dockPad = useDockPadding();
  const bottomInset = useBottomInset();
  const bottomPad = docked ? dockPad : footer ? 24 : bottomInset + 28;

  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.body, form && styles.formBody, { paddingBottom: bottomPad }, bodyStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={c.primary}
            colors={[c.primary]}
            progressBackgroundColor={c.card}
          />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, { paddingBottom: docked ? dockPad : 0 }]}>{children}</View>
  );

  return (
    <KeyboardAvoidingView style={[styles.page, form && styles.formPage]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={onBack ?? goBack}
            hitSlop={6}
            style={({ pressed }) => [styles.headerIcon, pressed && styles.headerIconPressed]}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={c.ink} />
          </Pressable>
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
          {right ? <View style={styles.headerRight}>{right}</View> : null}
        </View>
      </View>
      {body}
      {footer ? <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>{footer}</View> : null}
    </KeyboardAvoidingView>
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

type BtnTone = 'primary' | 'outline' | 'text' | 'danger';

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
    tone === 'primary' ? c.primaryInk : tone === 'danger' ? c.danger : tone === 'text' ? c.accent : c.ink;
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
};

/** Underlined text field: label on top, a single bottom rule that thickens on focus. */
export function Field({ label, hint, error, counter, prefix, style, multiline, onFocus, onBlur, ...input }: FieldProps) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const [focused, setFocused] = useState(false);
  const ruleColor = error ? c.danger : focused ? c.primary : c.lineStrong;
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, focused && { color: c.primary }, error ? { color: c.danger } : null]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldLine,
          multiline && styles.fieldLineMulti,
          { borderBottomColor: ruleColor, borderBottomWidth: focused || error ? 2 : 1 },
        ]}
      >
        {prefix ? <Text style={styles.prefix}>{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={c.faint}
          selectionColor={c.primary}
          cursorColor={c.primary}
          multiline={multiline}
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
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: Boolean(active) } : undefined}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? c.primary : c.body} /> : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
      {count != null ? <Text style={[styles.chipCount, active && styles.chipTextActive]}>{count}</Text> : null}
    </Pressable>
  );
}

export type TagTone = 'success' | 'danger' | 'warning' | 'neutral' | 'info';

export function Tag({ label, tone = 'neutral', icon }: { label: string; tone?: TagTone; icon?: IconName }) {
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
    <View style={[styles.tag, { backgroundColor: palette[0] }]}>
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
          style={styles.flex}
          contentContainerStyle={styles.sheetBody}
          keyboardShouldPersistTaps="handled"
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
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress?: () => void;
  tone?: 'danger' | 'warning' | 'success';
  last?: boolean;
  right?: ReactNode;
}) {
  const styles = useKitStyles();
  const c = useConsoleColors();
  const accent = tone === 'danger' ? c.danger : tone === 'warning' ? c.warning : tone === 'success' ? c.success : c.accent;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && styles.rowPressed]}
    >
      <View style={[styles.rowIcon, tone ? { backgroundColor: tone === 'danger' ? c.dangerSoft : tone === 'warning' ? c.warningSoft : c.successSoft } : null]}>
        <Ionicons name={icon} size={18} color={accent} />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{label}</Text>
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
      pointerEvents="none"
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
  page: { flex: 1, backgroundColor: c.page },
  header: {
    backgroundColor: c.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.line,
  },
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
    backgroundColor: c.danger,
    borderWidth: 1.5,
    borderColor: c.card,
  },
  headerBadgeText: { fontFamily: fonts.semiBold, fontSize: 9.5, color: '#FFFFFF' },
  headerCopy: { flex: 1, minWidth: 0, paddingLeft: 2 },
  headerTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  headerSub: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  body: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
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
  section: { gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  sectionAction: { fontFamily: fonts.semiBold, fontSize: 13.5, color: c.accent },
  panel: {
    backgroundColor: c.card,
    borderRadius: 14,
    borderWidth: c.isDark ? 1 : StyleSheet.hairlineWidth,
    borderColor: c.line,
    padding: 16,
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
  btnOutline: { backgroundColor: c.card, borderWidth: 1, borderColor: c.lineStrong },
  btnDanger: { backgroundColor: c.dangerSoft },
  btnText: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  btnDisabled: { opacity: 0.45 },
  btnLabel: { fontFamily: fonts.semiBold, fontSize: 15 },
  btnLabelSmall: { fontSize: 13.5 },
  pressed: { opacity: 0.8 },
  field: { gap: 2 },
  fieldLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  fieldLine: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: c.lineStrong,
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
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  chipActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  chipText: { fontFamily: fonts.regular, fontSize: 13.5, color: c.body },
  chipTextActive: { color: c.primary, fontFamily: fonts.semiBold },
  chipCount: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
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
  rowCopy: { flex: 1, minWidth: 0 },
  rowLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
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
    backgroundColor: c.isDark ? '#36312D' : '#101828',
  },
  toastText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, color: '#FFFFFF' },
}));
