import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthShell } from '../components/AuthShell';
import { AuthAlert } from '../components/AuthField';
import { OtpCodeBoxes } from '../components/OtpCodeBoxes';
import { PrimaryButton } from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/typography';
import { otpSendLabel, useOtpCooldown } from '../hooks/useOtpCooldown';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { requestPhoneVerifyCode, verifyPhoneCode, verifyPhoneWithTruecaller } from '../lib/authApi';
import { skipMobileGate } from '../lib/mobileGate';
import { mobileInputDigits, PHONE_INPUT_MAX_LENGTH } from '../lib/phoneInput';
import { displayAccountEmail } from '../lib/syntheticEmail';

export default function VerifyPhoneScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user, updateProfile, signOut } = useAuth();
  const otp = useOtpCooldown();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [truecallerBusy, setTruecallerBusy] = useState(false);
  const [error, setError] = useState('');

  const valid = /^[6-9]\d{9}$/.test(phone);
  const sent = otp.isSentTo(phone);
  const waiting = otp.isWaiting(phone);
  const busy = sending || verifying || truecallerBusy;
  const account = displayAccountEmail(user?.email) || user?.fullName || '';

  const save = async (verifiedPhone: string, token: string) => {
    const result = await updateProfile({ phone: verifiedPhone, phoneVerificationToken: token });
    if (!result.success) {
      setError(result.error);
      return false;
    }
    router.replace('/(tabs)/home');
    return true;
  };

  const sendCode = async () => {
    if (!valid || waiting || busy) return;
    setError('');
    setCode('');
    setSending(true);
    const result = await requestPhoneVerifyCode(phone);
    setSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    otp.markSent(phone);
  };

  const verify = async (entered: string) => {
    if (entered.length !== 6 || busy) return;
    setError('');
    setVerifying(true);
    const proof = await verifyPhoneCode(phone, entered);
    if (!proof.success) {
      setVerifying(false);
      setCode('');
      setError(proof.error);
      return;
    }
    const saved = await save(proof.phone, proof.phoneVerificationToken);
    if (!saved) setVerifying(false);
  };

  const verifyWithTruecaller = async () => {
    if (busy) return;
    setError('');
    setTruecallerBusy(true);
    const proof = await verifyPhoneWithTruecaller();
    if (!proof.success) {
      setTruecallerBusy(false);
      setError(proof.error);
      return;
    }
    const saved = await save(proof.phone, proof.phoneVerificationToken);
    if (!saved) setTruecallerBusy(false);
  };

  const leave = async () => {
    await signOut();
    router.replace('/login');
  };

  const skip = () => {
    skipMobileGate(user?.id);
    router.replace('/(tabs)/home');
  };

  return (
    <AuthShell
      hideBack
      plain
      topRight={
        <Pressable
          onPress={skip}
          disabled={busy}
          hitSlop={10}
          style={({ pressed }) => [styles.skip, (pressed || busy) && styles.skipPressed]}
          accessibilityRole="button"
          accessibilityLabel="Skip for now"
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      }
      title="Verify your mobile"
      subtitle={
        account
          ? `Signed in as ${account}. Add your mobile number to finish setting up your account.`
          : 'Add your mobile number to finish setting up your account.'
      }
      footer={
        <Text style={styles.footerText}>
          Not you?{' '}
          <Text style={styles.footerLink} onPress={() => void leave()}>
            Sign out
          </Text>
        </Text>
      }
    >
      <View style={styles.phoneRow}>
        <View style={styles.prefix}>
          <Text style={styles.prefixText}>+91</Text>
        </View>
        <TextInput
          value={phone}
          onChangeText={(value) => {
            const next = mobileInputDigits(value, phone);
            if (next !== phone) setCode('');
            setError('');
            setPhone(next);
          }}
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          placeholder="10-digit mobile"
          placeholderTextColor={colors.textSoft}
          maxLength={PHONE_INPUT_MAX_LENGTH}
          editable={!verifying && !truecallerBusy}
          style={styles.input}
          autoFocus
        />
        <Pressable
          style={[styles.sendBtn, (!valid || waiting || busy) && styles.disabled]}
          disabled={!valid || waiting || busy}
          onPress={() => void sendCode()}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendText}>{otpSendLabel(sent, waiting, otp.secondsLeft)}</Text>
          )}
        </Pressable>
      </View>
      <Text style={styles.hint}>We send a 6-digit code on WhatsApp to confirm the number is yours.</Text>

      {sent ? (
        <View style={styles.otpBlock}>
          <Text style={styles.otpLabel}>
            Enter the code sent to WhatsApp on +91 {phone.slice(0, 5)} {phone.slice(5)}
          </Text>
          <OtpCodeBoxes
            value={code}
            onChange={(value) => {
              setCode(value);
              setError('');
            }}
            onComplete={(value) => void verify(value)}
            autoFocus
            disabled={verifying}
          />
          <PrimaryButton
            label="Verify and continue"
            onPress={() => void verify(code)}
            loading={verifying}
            disabled={code.length !== 6 || busy}
          />
        </View>
      ) : null}

      {Platform.OS === 'android' ? (
        <Pressable
          style={[styles.truecaller, busy && styles.disabled]}
          disabled={busy}
          onPress={() => void verifyWithTruecaller()}
        >
          {truecallerBusy ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="call" size={14} color="#FFFFFF" />
              <Text style={styles.truecallerText}>Use my Truecaller number</Text>
            </>
          )}
        </Pressable>
      ) : null}

      {error ? (
        <View style={styles.alert}>
          <AuthAlert message={error} />
        </View>
      ) : null}
    </AuthShell>
  );
}

const useStyles = createThemedStyles((colors) => ({
  skip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  skipPressed: { opacity: 0.6 },
  skipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.heading,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefix: {
    height: 48,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.heading,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  sendBtn: {
    minWidth: 84,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  sendText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  disabled: { opacity: 0.45 },
  hint: {
    marginTop: 8,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSoft,
  },
  otpBlock: {
    marginTop: 16,
    gap: 12,
  },
  otpLabel: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  truecaller: {
    marginTop: 16,
    minHeight: 44,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0074E8',
  },
  truecallerText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
  alert: { marginTop: 14 },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.semiBold,
    color: colors.accent,
  },
}));
