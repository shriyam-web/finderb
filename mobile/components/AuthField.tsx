import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors } from '../constants/colors';

type FieldProps = TextInputProps & {
  label: string;
  error?: string;
  rightSlot?: ReactNode;
};

export function AuthField({ label, error, rightSlot, style, ...props }: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        <TextInput
          {...props}
          style={[styles.input, style]}
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
        {rightSlot}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  return (
    <Pressable onPress={onToggle} hitSlop={10} style={styles.toggle}>
      <Text style={styles.toggleText}>{visible ? 'Hide' : 'Show'}</Text>
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
  return (
    <View
      style={[
        styles.alert,
        tone === 'success' ? styles.alertSuccess : styles.alertDanger,
      ]}
    >
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

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    marginBottom: 7,
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: colors.mango,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.danger,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.ink,
    paddingVertical: 12,
  },
  toggle: {
    paddingLeft: 8,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.mangoDeep,
  },
  error: {
    marginTop: 6,
    fontSize: 12,
    color: colors.danger,
  },
  alert: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  alertDanger: {
    backgroundColor: colors.dangerBg,
  },
  alertSuccess: {
    backgroundColor: colors.successBg,
  },
  alertText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  alertTextDanger: {
    color: colors.danger,
  },
  alertTextSuccess: {
    color: colors.tealDeep,
  },
});
