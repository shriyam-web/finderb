import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthAlert, AuthField } from './AuthField';
import { OtpCodeBoxes } from './OtpCodeBoxes';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { useOtpCooldown } from '../hooks/useOtpCooldown';
import { requestWhatsAppOtp, verifyWhatsAppOtp, type WhatsAppAudience } from '../lib/authApi';
import type { AuthUser } from '../lib/session';

const OTP_LENGTH = 6;

type Props = {
  visible: boolean;
  audience: WhatsAppAudience;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
};

function formatPhone(digits: string) {
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export function WhatsAppOtpSheet({ visible, audience, onClose, onSuccess }: Props) {
  const styles = useStyles();
  const bottomInset = useBottomInset(12);
  const { applyAuthResult } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const otp = useOtpCooldown();
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setStep('phone');
    setCode('');
    setError('');
    setSending(false);
    setVerifying(false);
  }, [visible]);

  const digits = phone.replace(/\D/g, '').slice(-10);
  const phoneOk = /^[6-9]\d{9}$/.test(digits);

  const send = async () => {
    if (!phoneOk) {
      setError('Enter a 10-digit mobile number starting with 6, 7, 8, or 9.');
      return;
    }
    if (otp.isWaiting(digits)) {
      setStep('code');
      return;
    }
    setError('');
    setSending(true);
    const result = await requestWhatsAppOtp(digits, audience);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    otp.markSent(digits);
    setCode('');
    setStep('code');
  };

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || verifying) return;
    setError('');
    setVerifying(true);
    const result = await applyAuthResult(await verifyWhatsAppOtp(digits, value, audience));
    setVerifying(false);
    if (!result.success) {
      setError(result.error);
      setCode('');
      return;
    }
    onSuccess(result.user);
  };

  const close = () => {
    if (!verifying) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={styles.dismiss} onPress={close} accessibilityLabel="Close WhatsApp login" />
        <View style={[styles.sheet, { paddingBottom: 16 + bottomInset }]}>
          <View style={styles.head}>
            {step === 'code' ? (
              <Pressable
                onPress={() => {
                  setStep('phone');
                  setCode('');
                  setError('');
                }}
                disabled={verifying}
                hitSlop={10}
                accessibilityLabel="Change number"
              >
                <Ionicons name="arrow-back" size={22} color="#5C6B7A" />
              </Pressable>
            ) : (
              <Ionicons name="logo-whatsapp" size={22} color="#128C7E" />
            )}
            <Text style={styles.title}>
              {step === 'code'
                ? 'Enter OTP'
                : audience === 'business'
                  ? 'Business login with WhatsApp'
                  : 'Continue with WhatsApp'}
            </Text>
            <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color="#5C6B7A" />
            </Pressable>
          </View>

          {step === 'phone' ? (
            <>
              <Text style={styles.lead}>
                {audience === 'business'
                  ? 'Enter the mobile number on your FinderB business. We will send an OTP to its WhatsApp.'
                  : 'Enter your WhatsApp mobile number. We will send you an OTP on WhatsApp.'}
              </Text>
              {error ? (
                <View style={styles.alert}>
                  <AuthAlert message={error} />
                </View>
              ) : null}
              <AuthField
                label="Mobile number"
                value={phone}
                onChangeText={(value) => {
                  setPhone(value.replace(/\D/g, '').slice(0, 10));
                  setError('');
                }}
                placeholder="10-digit mobile number"
                keyboardType="number-pad"
                maxLength={10}
                autoComplete="tel"
                autoFocus
                leftSlot={<Text style={styles.prefix}>+91</Text>}
                onSubmitEditing={() => void send()}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.primary,
                  pressed && styles.pressed,
                  (!phoneOk || sending) && styles.disabled,
                ]}
                onPress={() => void send()}
                disabled={!phoneOk || sending}
              >
                {sending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>Send OTP</Text>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.sentText}>
                OTP has been sent to the WhatsApp account linked to{' '}
                <Text style={styles.sentPhone}>{formatPhone(digits)}</Text>
              </Text>
              <OtpCodeBoxes
                value={code}
                length={OTP_LENGTH}
                autoFocus
                disabled={verifying}
                onChange={(value) => {
                  setCode(value);
                  setError('');
                }}
                onComplete={(value) => void verify(value)}
              />
              {error ? (
                <View style={styles.alert}>
                  <AuthAlert message={error} />
                </View>
              ) : null}
              <Pressable
                style={({ pressed }) => [
                  styles.primary,
                  pressed && styles.pressed,
                  (code.length !== OTP_LENGTH || verifying) && styles.disabled,
                ]}
                onPress={() => void verify()}
                disabled={code.length !== OTP_LENGTH || verifying}
              >
                {verifying ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryText}>Verify and continue</Text>
                )}
              </Pressable>
              <View style={styles.resendRow}>
                {otp.isWaiting(digits) ? (
                  <Text style={styles.resendMuted}>Resend OTP in {otp.secondsLeft}s</Text>
                ) : (
                  <>
                    <Text style={styles.resendMuted}>Didn't get it? </Text>
                    <Pressable onPress={() => void send()} disabled={sending || verifying} hitSlop={8}>
                      <Text style={styles.resendLink}>{sending ? 'Sending…' : 'Resend OTP'}</Text>
                    </Pressable>
                  </>
                )}
              </View>
            </>
          )}
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
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
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
  prefix: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
    marginRight: 8,
  },
  sentText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textSoft,
    textAlign: 'center',
    marginBottom: 8,
  },
  sentPhone: {
    fontFamily: fonts.semiBold,
    color: colors.ink,
  },
  alert: { marginVertical: 6 },
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
  resendRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendMuted: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textSoft,
  },
  resendLink: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#128C7E',
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.6 },
}));
