import type { ReactNode } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { goBackOrHome } from '../lib/navigation';

type Props = {
  title: string;
  subtitle?: string;
  /** Large left-aligned title for list screens */
  variant?: 'bar' | 'page';
  onBack?: () => void;
  right?: ReactNode;
  style?: ViewStyle;
};

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    gap: 2,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  barCopy: {
    flex: 1,
    justifyContent: 'center' as const,
    minWidth: 0,
    paddingRight: 8,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    letterSpacing: -0.3,
    color: colors.heading,
  },
  barSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
  },
  spacer: {
    width: 36,
  },
  rightSlot: {
    minWidth: 36,
    alignItems: 'flex-end' as const,
  },
  pageWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  pageTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 12,
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.muted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  pageTitle: {
    fontFamily: fonts.bold,
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.5,
    color: colors.heading,
  },
  pageSubtitle: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
}));

export function ScreenHeader({
  title,
  subtitle,
  variant = 'bar',
  onBack,
  right,
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const goBack = () => (onBack ? onBack() : goBackOrHome(router));

  if (variant === 'page') {
    return (
      <View style={[styles.pageWrap, style]}>
        <View style={styles.pageTop}>
          <Pressable
            style={styles.backCircle}
            onPress={goBack}
            hitSlop={8}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>
          {right ? <View>{right}</View> : <View style={styles.spacer} />}
        </View>
        <Text style={styles.pageTitle}>{title}</Text>
        {subtitle ? <Text style={styles.pageSubtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        style={styles.back}
        onPress={goBack}
        hitSlop={8}
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color={colors.ink} />
      </Pressable>
      <View style={styles.barCopy}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.barSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.rightSlot}>{right}</View> : <View style={styles.spacer} />}
    </View>
  );
}
