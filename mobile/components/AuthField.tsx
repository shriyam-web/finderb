import { ReactNode, useState } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { bizColors } from '../constants/businessColors';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  leftSlot?: ReactNode;
  rightSlot?: ReactNode;
  footer?: ReactNode;
  fontFamily?: string;
  dimmed?: boolean;
};

export function AuthField({ label, error, leftSlot, rightSlot, footer, style, fontFamily, dimmed, ...props }: FieldProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const filled = Boolean(props.value && String(props.value).length);

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.shell,
          focused && styles.inputFocused,
          !!error && styles.inputError,
          dimmed && styles.shellDimmed,
        ]}
      >
        <View style={styles.inputRow}>
          {leftSlot ? <View style={styles.leftSlot}>{leftSlot}</View> : null}
          <View style={styles.fieldCol}>
            <Text
              style={[
                styles.label,
                (focused || filled) && styles.labelActive,
                fontFamily ? { fontFamily } : null,
              ]}
            >
              {label}
            </Text>
            <TextInput
              {...props}
              style={[styles.input, fontFamily ? { fontFamily } : null, style]}
              placeholderTextColor={colors.textSoft}
              onFocus={(e) => {
                setFocused(true);
                props.onFocus?.(e);
              }}
              onBlur={(e) => {
                setFocused(false);
                props.onBlur?.(e);
              }}
            />
          </View>
          {rightSlot}
        </View>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {footer ? <View style={[styles.footer, dimmed && styles.shellDimmed]}>{footer}</View> : null}
    </View>
  );
}

export function PasswordToggle({
  visible,
  onToggle,
}: {
  visible: boolean;
  onToggle: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={10}
      style={styles.toggle}
      accessibilityLabel={visible ? 'Hide password' : 'Show password'}
    >
      <Ionicons
        name={visible ? 'eye-off-outline' : 'eye-outline'}
        size={18}
        color={colors.textSoft}
      />
    </Pressable>
  );
}

export function AuthAlert({
  message,
  tone = 'danger',
}: {
  message: string;
  tone?: 'danger' | 'success';
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      style={[
        styles.alert,
        tone === 'success' ? styles.alertSuccess : styles.alertDanger,
      ]}
    >
      <Ionicons
        name={tone === 'success' ? 'checkmark-circle' : 'alert-circle'}
        size={16}
        color={tone === 'success' ? colors.success : colors.danger}
      />
      <Text
        style={[
          styles.alertText,
          tone === 'success' ? styles.alertTextSuccess : styles.alertTextDanger,
        ]}
      >
        {message}
      </Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  return {
  wrap: {
    marginBottom: 10,
  },
  shell: {
    borderBottomWidth: 1.5,
    borderBottomColor: b.lineStrong,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  shellDimmed: {
    opacity: 0.45,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    paddingBottom: 6,
  },
  footer: {
    paddingTop: 6,
  },
  inputFocused: {
    borderBottomColor: b.blue,
    borderBottomWidth: 2,
  },
  inputError: {
    borderBottomColor: colors.danger,
  },
  leftSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  fieldCol: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 7,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
    marginBottom: 1,
  },
  labelActive: {
    color: colors.accentDeep,
  },
  input: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: colors.ink,
    padding: 0,
    margin: 0,
  },
  toggle: {
    paddingLeft: 8,
    paddingVertical: 6,
  },
  error: {
    marginTop: 4,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.danger,
  },
  alert: {
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 11,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  alertDanger: {
    backgroundColor: colors.dangerBg,
  },
  alertSuccess: {
    backgroundColor: colors.successBg,
  },
  alertText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 17,
  },
  alertTextDanger: {
    color: colors.danger,
  },
  alertTextSuccess: {
    color: colors.success,
  },
};
});
