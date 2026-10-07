import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { fonts } from '../constants/typography';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  accent?: string;
};

/**
 * One box per digit over a single hidden input, so the keyboard, paste and
 * Android SMS / WhatsApp code autofill all fill every box at once.
 */
export function OtpCodeBoxes({
  value,
  onChange,
  onComplete,
  length = 6,
  autoFocus,
  disabled,
  accent = '#128C7E',
}: Props) {
  const styles = useStyles();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const digits = value.replace(/\D/g, '').slice(0, length);

  useEffect(() => {
    if (!autoFocus || disabled) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => clearTimeout(timer);
  }, [autoFocus, disabled]);

  return (
    <Pressable
      style={styles.row}
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      accessibilityLabel={`${length}-digit code`}
    >
      {Array.from({ length }, (_, index) => {
        const active = focused && !disabled && index === Math.min(digits.length, length - 1);
        return (
          <View
            key={index}
            style={[
              styles.box,
              digits[index] ? styles.boxFilled : null,
              active ? { borderColor: accent, borderWidth: 2 } : null,
              disabled ? styles.boxDisabled : null,
            ]}
          >
            <Text style={styles.digit}>{digits[index] ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={digits}
        onChangeText={(text) => {
          const next = text.replace(/\D/g, '').slice(0, length);
          onChange(next);
          if (next.length === length) onComplete?.(next);
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        editable={!disabled}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        caretHidden
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const useStyles = createThemedStyles((colors) => ({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  box: {
    width: 46,
    height: 54,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {
    borderColor: colors.ink,
  },
  boxDisabled: {
    opacity: 0.5,
  },
  digit: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.ink,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.01,
    color: 'transparent',
  },
}));
