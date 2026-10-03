import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthAlert, AuthField } from './AuthField';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { otpSendLabel, useOtpCooldown } from '../hooks/useOtpCooldown';
import { requestWhatsAppOtp, verifyWhatsAppOtp, type WhatsAppAudience } from '../lib/authApi';
import type { AuthUser } from '../lib/session';

type Props = {
  visible: boolean;
  audience: WhatsAppAudience;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
};

export function WhatsAppOtpSheet({ visible, audience, onClose, onSuccess }: Props) {
  const styles = useStyles();
  const { applyAuthResult } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const otp = useOtpCooldown();
  const [hint, setHint] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhone('');
    setCode('');
    otp.clearSent();
    setHint('');
    setError('');
    setSending(false);
    setVerifying(false);
  }, [visible]);

  const digits = phone.replace(/\D/g, '').slice(-10);
  const phoneOk = /^[6-9]\d{9}$/.test(digits);
  const busy = sending || verifying;

  const send = async () => {
    if (!phoneOk) {
      setError('Enter a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (otp.isWaiting(digits)) return;
    setCode('');
    setError('');
    setHint('');
    setSending(true);
    const result = await requestWhatsAppOtp(digits, audience);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    otp.markSent(digits);
    setHint(result.message);
  };

  const verify = async () => {
    if (code.replace(/\D/g, '').length !== 6) {
      setError('Enter the 6-digit code from WhatsApp.');
      return;
    }
    setError('');
    setVerifying(true);
    const result = await applyAuthResult(await verifyWhatsAppOtp(digits, code, audience));
    setVerifying(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    onSuccess(result.user);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.dismiss} onPress={onClose} accessibilityLabel="Close WhatsApp login" />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <Ionicons name="logo-whatsapp" size={22} color="#128C7E" />
            <Text style={styles.title}>
              {audience === 'business' ? 'Business WhatsApp login' : 'WhatsApp login'}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color="#5C6B7A" />
            </Pressable>
          </View>
          <Text style={styles.lead}>
            {audience === 'business'
              ? 'Use the mobile number on your FinderB business. We will send a code on WhatsApp.'
              : 'Enter your WhatsApp number. We will send a 6-digit code to sign you in.'}
          </Text>
          {error ? (
            <View style={styles.alert}>
              <AuthAlert message={error} />
            </View>
          ) : null}
          <AuthField
            label="WhatsApp number"
            value={phone}
            onChangeText={(value) => {
              const next = value.replace(/\D/g, '').slice(0, 10);
              if (next !== phone) setCode('');
              setPhone(next);
              setHint('');
              setError('');
            }}
            placeholder="10-digit mobile"
            keyboardType="number-pad"
            maxLength={10}
            autoComplete="tel"
            rightSlot={
              <Pressable
                onPress={() => void send()}
                disabled={busy || otp.isWaiting(digits) || !phoneOk}
                style={[styles.sendBtn, (busy || otp.isWaiting(digits) || !phoneOk) && styles.disabled]}
              >
                <Text style={styles.sendBtnText}>
                  {sending ? '…' : otpSendLabel(otp.isSentTo(digits), otp.isWaiting(digits), otp.secondsLeft)}
                </Text>
              </Pressable>
            }
          />
          {otp.isSentTo(digits) ? (
            <AuthField
              label="WhatsApp code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              keyboardType="number-pad"
              maxLength={6}
              autoComplete="one-time-code"
            />
          ) : null}
          {hint ? <Text style={styles.hint}>{hint}</Text> : null}
          {otp.isSentTo(digits) ? (
            <Pressable
              style={({ pressed }) => [styles.primary, pressed && styles.pressed, busy && styles.disabled]}
              onPress={() => void verify()}
              disabled={busy || code.length !== 6}
            >
              {verifying ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryText}>Verify and continue</Text>
              )}
            </Pressable>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 32, 0.45)',
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 28,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: colors.ink,
  },
  lead: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSoft,
    marginBottom: 12,
  },
  alert: { marginBottom: 8 },
  hint: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 13,
    color: '#0F766E',
  },
  primary: {
    marginTop: 14,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#128C7E',
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: '#FFFFFF',
  },
  sendBtn: {
    marginLeft: 8,
    minWidth: 76,
    height: 34,
    borderRadius: 8,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sendBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
}));
