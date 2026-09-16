import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import type { Merchant } from '../lib/merchants';
import { submitBroadcastEnquiry } from '../lib/leadsApi';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Step = 'options' | 'form' | 'done';

type Props = {
  merchant: Merchant;
  visible: boolean;
  onClose: () => void;
  contactRevealed: boolean;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  onCall: () => void;
  onWhatsApp: () => void;
};

function maskPhone(value?: string | null): string {
  const trimmed = (value || '').trim();
  if (!trimmed) return 'sign in to view';
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 6) return 'sign in to view';
  return `${digits.slice(0, 2)}${'•'.repeat(Math.max(2, digits.length - 4))}${digits.slice(-2)}`;
}

export function ConnectMerchantModal({
  merchant,
  visible,
  onClose,
  contactRevealed,
  userName = '',
  userEmail = '',
  userPhone = '',
  onCall,
  onWhatsApp,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const [step, setStep] = useState<Step>('options');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [merchantCount, setMerchantCount] = useState(0);
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState(userPhone);
  const [lookingFor, setLookingFor] = useState('');

  const area = (merchant.city || merchant.location || '').trim();
  const areaUnavailable =
    !area || /not specified|unknown/i.test(area);

  useEffect(() => {
    if (visible) {
      setStep('options');
      setError('');
      setLoading(false);
      setName(userName);
      setEmail(userEmail);
      setPhone(userPhone);
      setLookingFor('');
    }
  }, [visible, userName, userEmail, userPhone]);

  useEffect(() => {
    if (!visible) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [visible, onClose]);

  const goLogin = () => {
    onClose();
    router.push({
      pathname: '/login',
      params: { returnTo: `/merchant/${merchant.slug || merchant.id}` },
    } as Href);
  };

  const submitEnquiry = async () => {
    if (!contactRevealed) return;
    if (!name.trim() || !phone.trim() || !email.trim() || !lookingFor.trim()) {
      setError('Please fill name, email, phone, and what you need.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await submitBroadcastEnquiry({
      sourceBusinessId: merchant.id,
      category: merchant.category,
      area,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      lookingFor: lookingFor.trim(),
    });
    if (!result.success) {
      if (result.unauthorized) {
        goLogin();
      } else {
        setError(result.error);
      }
      setLoading(false);
      return;
    }
    setMerchantCount(result.merchantCount);
    setStep('done');
    setLoading(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.dismiss} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.head}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.title} numberOfLines={1}>
                {step === 'form'
                  ? 'Send enquiry'
                  : step === 'done'
                    ? 'Enquiry sent'
                    : `Contact ${merchant.name}`}
              </Text>
              {step === 'options' ? (
                <Text style={styles.sub}>
                  {contactRevealed
                    ? 'Choose how you want to reach them.'
                    : 'Sign in to view contact options.'}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyPad}
            keyboardShouldPersistTaps="handled"
          >
            {!contactRevealed && step !== 'done' ? (
              <View style={styles.authBanner}>
                <Text style={styles.authText}>
                  Sign in to call, WhatsApp, or send an enquiry. We’ll bring you
                  back here and count you as a lead for the merchant.
                </Text>
                <View style={styles.authRow}>
                  <Pressable style={styles.authPrimary} onPress={goLogin}>
                    <Text style={styles.authPrimaryText}>Sign in</Text>
                  </Pressable>
                  <Pressable
                    style={styles.authSecondary}
                    onPress={() => {
                      onClose();
                      router.push('/signup' as Href);
                    }}
                  >
                    <Text style={styles.authSecondaryText}>Create account</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {step === 'options' ? (
              <View style={styles.options}>
                <Pressable
                  style={[styles.option, !contactRevealed && styles.optionDisabled]}
                  disabled={!contactRevealed}
                  onPress={() => {
                    onWhatsApp();
                    onClose();
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#128C7E" />
                  <Text style={styles.optionText}>WhatsApp</Text>
                </Pressable>

                <Pressable
                  style={[styles.option, !contactRevealed && styles.optionDisabled]}
                  disabled={!contactRevealed}
                  onPress={() => {
                    onCall();
                    onClose();
                  }}
                >
                  <Ionicons name="call-outline" size={18} color={colors.ink} />
                  <Text style={styles.optionText}>
                    {contactRevealed
                      ? `Phone — ${merchant.contact}`
                      : `Phone — ${maskPhone(merchant.contact)}`}
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.option,
                    (!contactRevealed || areaUnavailable) && styles.optionDisabled,
                  ]}
                  disabled={!contactRevealed || areaUnavailable}
                  onPress={() => setStep('form')}
                >
                  <Ionicons name="mail-outline" size={18} color={colors.ink} />
                  <Text style={styles.optionText}>
                    Send enquiry to merchants in {merchant.category || 'this category'}
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {step === 'form' ? (
              <View style={styles.form}>
                <Field label="Name" value={name} onChangeText={setName} />
                <Field
                  label="Phone"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Field
                  label="What are you looking for?"
                  value={lookingFor}
                  onChangeText={setLookingFor}
                  multiline
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable
                  style={[styles.submit, loading && styles.submitBusy]}
                  disabled={loading}
                  onPress={() => void submitEnquiry()}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.onDark} />
                  ) : (
                    <Text style={styles.submitText}>Send enquiry</Text>
                  )}
                </Pressable>
                <Pressable onPress={() => setStep('options')} style={styles.backLink}>
                  <Text style={styles.backLinkText}>Back to options</Text>
                </Pressable>
              </View>
            ) : null}

            {step === 'done' ? (
              <View style={styles.doneBox}>
                <View style={styles.doneIcon}>
                  <Ionicons name="checkmark" size={22} color={colors.success} />
                </View>
                <Text style={styles.doneTitle}>You’re connected</Text>
                <Text style={styles.doneBody}>
                  Your enquiry was shared with{' '}
                  {merchantCount > 1 ? `${merchantCount} merchants` : 'the merchant'} in{' '}
                  {merchant.category || 'this category'}.
                </Text>
                <Pressable style={styles.submit} onPress={onClose}>
                  <Text style={styles.submitText}>Done</Text>
                </Pressable>
              </View>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType,
  autoCapitalize,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize || 'sentences'}
        multiline={multiline}
        placeholderTextColor={colors.textSoft}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 40,
    elevation: 40,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  dismiss: { flex: 1 },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '82%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingBottom: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.heading,
  },
  sub: {
    marginTop: 3,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { maxHeight: 480 },
  bodyPad: { padding: 16, paddingBottom: 28 },
  authBanner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: colors.canvasWarm,
    padding: 12,
    marginBottom: 14,
  },
  authText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textMuted,
  },
  authRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  authPrimary: {
    backgroundColor: colors.brand,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authPrimaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.onDark,
  },
  authSecondary: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  authSecondaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  options: { gap: 8 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: colors.surface,
  },
  optionDisabled: { opacity: 0.5 },
  optionText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  form: { gap: 12 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    backgroundColor: colors.surfaceSoft,
  },
  inputMulti: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.danger,
  },
  submit: {
    marginTop: 4,
    backgroundColor: colors.brand,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    minHeight: 46,
  },
  submitBusy: { opacity: 0.75 },
  submitText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  backLink: { alignItems: 'center', paddingVertical: 8 },
  backLinkText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  doneBox: { alignItems: 'center', gap: 10, paddingTop: 8 },
  doneIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.heading,
  },
  doneBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
}));
