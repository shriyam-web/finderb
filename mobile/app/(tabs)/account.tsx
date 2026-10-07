import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OtpCodeBoxes } from '../../components/OtpCodeBoxes';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useNotificationInbox } from '../../context/NotificationInboxContext';
import { fonts } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { otpSendLabel, useOtpCooldown } from '../../hooks/useOtpCooldown';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import {
  requestPhoneVerifyCode,
  requestUserEmailOtp,
  uploadMobileAvatar,
  verifyPhoneCode,
  verifyPhoneWithTruecaller,
  verifyUserEmailOtp,
} from '../../lib/authApi';
import { mobileInputDigits, PHONE_INPUT_MAX_LENGTH } from '../../lib/phoneInput';
import { displayAccountEmail } from '../../lib/syntheticEmail';
import { SITE_URL } from '../../lib/supabase';
import { getAppVersionLabel } from '../../lib/appVersion';
import { TabSwipeHost } from '../../lib/tabSwipe';

type MenuItem = {
  title: string;
  onPress: () => void;
};

const SUPPORT_EMAIL = 'support@finderb.com';

function lastTenDigits(phone: string | null | undefined) {
  return (phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').slice(-10);
}

export default function AccountScreen() {
  const { colors, isDark, toggleDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user, loading, signOut, updateProfile, applyAuthResult } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const { unreadCount } = useNotificationInbox();
  const scrollBottomPad = useTabScrollPadding(28);

  const [editing, setEditing] = useState(false);
  const businessAccount = Boolean(user?.isBusinessAccount);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailProof, setEmailProof] = useState('');
  const [emailProofFor, setEmailProofFor] = useState('');
  const [emailHint, setEmailHint] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const emailOtp = useOtpCooldown();
  const [phoneCode, setPhoneCode] = useState('');
  const [phoneProof, setPhoneProof] = useState('');
  const [phoneProofFor, setPhoneProofFor] = useState('');
  const [phoneHint, setPhoneHint] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneVerifying, setPhoneVerifying] = useState(false);
  const [truecallerVerifying, setTruecallerVerifying] = useState(false);
  const phoneOtp = useOtpCooldown();
  const [avatarBusy, setAvatarBusy] = useState(false);

  const pickAvatar = async () => {
    if (avatarBusy) return;
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    const asset = picked.canceled ? null : picked.assets?.[0];
    if (!asset) return;
    setAvatarBusy(true);
    try {
      const rendered = await ImageManipulator.manipulate(asset.uri).resize({ width: 512 }).renderAsync();
      const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.85, base64: true });
      if (!saved.base64) throw new Error('empty image');
      const result = await applyAuthResult(await uploadMobileAvatar(`data:image/jpeg;base64,${saved.base64}`));
      if (!result.success) Alert.alert('Could not update photo', result.error);
    } catch {
      Alert.alert('Could not update photo', 'This photo could not be used. Please choose another one.');
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    setAvatarBusy(true);
    const result = await updateProfile({ avatarUrl: null });
    setAvatarBusy(false);
    if (!result.success) Alert.alert('Could not remove photo', result.error);
  };

  const openAvatarMenu = () => {
    if (avatarBusy) return;
    if (!user?.avatarUrl) {
      void pickAvatar();
      return;
    }
    Alert.alert('Profile photo', undefined, [
      { text: 'Choose new photo', onPress: () => void pickAvatar() },
      { text: 'Remove photo', style: 'destructive', onPress: () => void removeAvatar() },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const startEdit = () => {
    if (!user) return;
    setNameDraft(user.fullName || '');
    setEmailDraft(displayAccountEmail(user.email));
    setEmailCode('');
    setEmailProof('');
    setEmailProofFor('');
    setEmailHint('');
    emailOtp.clearSent();
    setPhoneDraft(lastTenDigits(user.phone));
    setPhoneCode('');
    setPhoneProof('');
    setPhoneProofFor('');
    setPhoneHint('');
    phoneOtp.clearSent();
    setSaveError('');
    setEditing(true);
  };

  const providerKey = (user?.authProvider || '').toLowerCase();
  const emailLocked = providerKey === 'google';
  const savedEmail = displayAccountEmail(user?.email);
  const nextEmail = emailDraft.trim().toLowerCase();
  const emailChanging = !emailLocked && Boolean(nextEmail) && nextEmail !== savedEmail.toLowerCase();
  const emailVerified = emailChanging && emailProofFor === nextEmail && Boolean(emailProof);
  const signInPhone = providerKey === 'truecaller' || providerKey.includes('whatsapp');
  const savedPhone = lastTenDigits(user?.phone);
  const phoneLocked = signInPhone && Boolean(savedPhone);
  const phoneValid = /^[6-9]\d{9}$/.test(phoneDraft);
  const phoneChanging = !phoneLocked && Boolean(phoneDraft) && phoneDraft !== savedPhone;
  const phoneVerified = phoneChanging && phoneProofFor === phoneDraft && Boolean(phoneProof);
  const phoneBusy = phoneSending || phoneVerifying || truecallerVerifying;

  const sendPhoneCode = async () => {
    if (!phoneValid || phoneOtp.isWaiting(phoneDraft)) return;
    setPhoneCode('');
    setSaveError('');
    setPhoneHint('');
    setPhoneSending(true);
    const result = await requestPhoneVerifyCode(phoneDraft);
    setPhoneSending(false);
    if (!result.success) {
      setSaveError(result.error);
      return;
    }
    phoneOtp.markSent(phoneDraft);
  };

  const checkPhoneCode = async () => {
    setSaveError('');
    setPhoneVerifying(true);
    const result = await verifyPhoneCode(phoneDraft, phoneCode);
    setPhoneVerifying(false);
    if (!result.success) {
      setSaveError(result.error);
      return;
    }
    setPhoneProof(result.phoneVerificationToken);
    setPhoneProofFor(result.phone);
    setPhoneHint(result.message);
  };

  const verifyWithTruecaller = async () => {
    setSaveError('');
    setPhoneHint('');
    setTruecallerVerifying(true);
    const result = await verifyPhoneWithTruecaller();
    setTruecallerVerifying(false);
    if (!result.success) {
      setSaveError(result.error);
      return;
    }
    setPhoneDraft(result.phone);
    setPhoneCode('');
    setPhoneProof(result.phoneVerificationToken);
    setPhoneProofFor(result.phone);
    setPhoneHint(result.message);
  };

  const saveProfile = async () => {
    if (!user) return;
    if (phoneDraft && !phoneValid && phoneChanging) {
      setSaveError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (phoneChanging && !phoneVerified) {
      setSaveError('Verify the new mobile number on WhatsApp or with Truecaller before saving.');
      return;
    }
    if (emailChanging && !emailVerified) {
      setSaveError('Verify this email with the code we send you.');
      return;
    }
    setSaving(true);
    setSaveError('');
    const result = await updateProfile({
      fullName: nameDraft.trim(),
      email: emailLocked ? undefined : emailDraft.trim() || undefined,
      phone: phoneLocked ? undefined : phoneDraft,
      emailVerificationToken: emailChanging ? emailProof : undefined,
      phoneVerificationToken: phoneChanging ? phoneProof : undefined,
    });
    setSaving(false);
    if (!result.success) {
      setSaveError(result.error);
      Alert.alert('Could not save', result.error);
      return;
    }
    setEditing(false);
  };

  const menu: MenuItem[] = [
    {
      title: 'Favourites',
      onPress: () => (user ? router.push('/favorites' as Href) : requestLogin('/favorites')),
    },
    {
      title: 'Saved blogs',
      onPress: () => router.push('/saved-blogs' as Href),
    },
    {
      title: 'Notifications',
      onPress: () => router.push('/(tabs)/notifications' as Href),
    },
    businessAccount
      ? {
          title: 'Business dashboard',
          onPress: () => router.push('/merchant-welcome' as Href),
        }
      : {
          title: 'For businesses',
          onPress: () => router.push('/business-app' as Href),
        },
    {
      title: 'Help & support',
      onPress: () => {
        void Linking.openURL(
          `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('FinderB app support')}`,
        );
      },
    },
  ];

  return (
    <TabSwipeHost>
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title="Your Account" variant="bar" style={styles.header} />

          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={colors.ink} />
              </View>
            ) : user ? (
              <View style={styles.profileCard}>
                <View style={styles.profileTop}>
                  <Pressable
                    onPress={openAvatarMenu}
                    disabled={avatarBusy || businessAccount}
                    hitSlop={6}
                    accessibilityRole={businessAccount ? 'image' : 'button'}
                    accessibilityLabel={
                      businessAccount
                        ? 'Business photo'
                        : user.avatarUrl
                          ? 'Change profile photo'
                          : 'Add profile photo'
                    }
                  >
                    {user.avatarUrl ? (
                      <Image source={{ uri: user.avatarUrl }} style={styles.avatar} alt="Profile photo" />
                    ) : (
                      <View style={[styles.avatar, styles.avatarFallback]}>
                        <Text style={styles.avatarInitial}>
                          {(user.fullName || 'U').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    {avatarBusy ? (
                      <View style={[styles.avatar, styles.avatarOverlay]}>
                        <ActivityIndicator color={colors.white} />
                      </View>
                    ) : null}
                    {businessAccount ? null : (
                      <View style={styles.avatarBadge}>
                        <Ionicons name="camera" size={12} color={colors.white} />
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.profileCopy}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user.fullName}
                    </Text>
                    {businessAccount ? (
                      <Text style={styles.profileBusiness} numberOfLines={1}>
                        {user.businessName ? `${user.businessName} · Business account` : 'Business account'}
                      </Text>
                    ) : null}
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {displayAccountEmail(user.email) || 'No email'}
                    </Text>
                    <Text style={styles.profileMeta} numberOfLines={1}>
                      {user.phone?.trim() || 'No mobile'}
                    </Text>
                  </View>
                  {businessAccount ? null : (
                    <Pressable
                      style={styles.editBtn}
                      onPress={startEdit}
                      hitSlop={8}
                      accessibilityLabel="Edit profile"
                    >
                      <Ionicons name="create-outline" size={16} color={colors.ink} />
                    </Pressable>
                  )}
                </View>

                {businessAccount ? (
                  <Text style={styles.businessNote}>
                    These details come from your business profile. Change them, and the photo, from the business
                    dashboard.
                  </Text>
                ) : null}

                {editing && !businessAccount ? (
                  <View style={styles.editBlock}>
                    <Text style={styles.editLabel}>Name</Text>
                    <TextInput
                      value={nameDraft}
                      onChangeText={setNameDraft}
                      style={styles.editInput}
                      placeholderTextColor={colors.textSoft}
                    />
                    <Text style={styles.editLabel}>Email</Text>
                    {emailLocked ? (
                      <Text style={styles.lockedValue}>{displayAccountEmail(user.email) || 'Not added'}</Text>
                    ) : (
                      <View style={styles.emailRow}>
                        <TextInput
                          value={emailDraft}
                          onChangeText={(value) => {
                            const next = value.trim().toLowerCase();
                            if (next !== nextEmail) setEmailCode('');
                            setEmailDraft(value);
                            setEmailHint('');
                            setSaveError('');
                          }}
                          autoCapitalize="none"
                          keyboardType="email-address"
                          style={[styles.editInput, styles.emailInput]}
                          placeholder="Add your email"
                          placeholderTextColor={colors.textSoft}
                        />
                        {emailChanging && !emailVerified ? (
                          <Pressable
                            style={[
                              styles.otpInline,
                              (emailSending || emailOtp.isWaiting(nextEmail)) && styles.disabled,
                            ]}
                            disabled={emailSending || emailOtp.isWaiting(nextEmail)}
                            onPress={() => {
                              void (async () => {
                                if (emailOtp.isWaiting(nextEmail)) return;
                                setEmailCode('');
                                setSaveError('');
                                setEmailHint('');
                                setEmailSending(true);
                                const result = await requestUserEmailOtp(nextEmail);
                                setEmailSending(false);
                                if (!result.success) {
                                  setSaveError(result.error);
                                  return;
                                }
                                emailOtp.markSent(nextEmail);
                                setEmailHint(result.message);
                              })();
                            }}
                          >
                            <Text style={styles.otpInlineText}>
                              {emailSending
                                ? '…'
                                : otpSendLabel(
                                    emailOtp.isSentTo(nextEmail),
                                    emailOtp.isWaiting(nextEmail),
                                    emailOtp.secondsLeft,
                                  )}
                            </Text>
                          </Pressable>
                        ) : null}
                      </View>
                    )}
                    {emailLocked ? (
                      <Text style={styles.editHint}>
                        {"Can't be updated as you have registered your account with this Google email."}
                      </Text>
                    ) : emailChanging ? (
                      <View style={styles.otpBlock}>
                        <Text style={styles.editHint}>
                          {emailVerified
                            ? 'Email verified. You can save it now.'
                            : emailOtp.isSentTo(nextEmail)
                              ? 'Enter the 6-digit code from your email.'
                              : 'Send a code to this address before it is saved.'}
                        </Text>
                        {emailOtp.isSentTo(nextEmail) && !emailVerified ? (
                          <>
                            <OtpCodeBoxes
                              value={emailCode}
                              onChange={setEmailCode}
                              autoFocus
                              disabled={emailVerifying}
                            />
                            <Pressable
                              style={[styles.otpBtnPrimary, (emailVerifying || emailCode.length !== 6) && styles.disabled]}
                              disabled={emailVerifying || emailCode.length !== 6}
                              onPress={() => {
                                void (async () => {
                                  setSaveError('');
                                  setEmailVerifying(true);
                                  const result = await verifyUserEmailOtp(nextEmail, emailCode);
                                  setEmailVerifying(false);
                                  if (!result.success || !result.emailVerificationToken) {
                                    setSaveError(result.success ? 'Could not verify that email.' : result.error);
                                    return;
                                  }
                                  setEmailProof(result.emailVerificationToken);
                                  setEmailProofFor(nextEmail);
                                  setEmailHint(result.message);
                                })();
                              }}
                            >
                              <Text style={styles.otpBtnPrimaryText}>{emailVerifying ? 'Checking…' : 'Verify'}</Text>
                            </Pressable>
                          </>
                        ) : null}
                        {emailHint ? <Text style={styles.emailHint}>{emailHint}</Text> : null}
                      </View>
                    ) : (
                      <Text style={styles.editHint}>Add or change your email, then verify it with a code.</Text>
                    )}
                    <Text style={styles.editLabel}>Mobile number</Text>
                    {phoneLocked ? (
                      <>
                        <Text style={styles.lockedValue}>
                          +91 {savedPhone.slice(0, 5)} {savedPhone.slice(5)}
                        </Text>
                        <Text style={styles.editHint}>
                          {"Can't be updated as you have registered your account with this number."}
                        </Text>
                      </>
                    ) : (
                    <>
                    <View style={styles.phoneRow}>
                      <Text style={styles.phonePrefix}>+91</Text>
                      <TextInput
                        value={phoneDraft}
                        onChangeText={(value) => {
                          const next = mobileInputDigits(value, phoneDraft);
                          if (next !== phoneDraft) setPhoneCode('');
                          setSaveError('');
                          setPhoneHint('');
                          setPhoneDraft(next);
                        }}
                        keyboardType="phone-pad"
                        autoComplete="tel"
                        textContentType="telephoneNumber"
                        style={[styles.editInput, styles.phoneInput]}
                        placeholder="10-digit mobile"
                        placeholderTextColor={colors.textSoft}
                        maxLength={PHONE_INPUT_MAX_LENGTH}
                      />
                      {phoneChanging && !phoneVerified ? (
                        <Pressable
                          style={[
                            styles.otpInline,
                            styles.whatsappInline,
                            (phoneBusy || !phoneValid || phoneOtp.isWaiting(phoneDraft)) && styles.disabled,
                          ]}
                          disabled={phoneBusy || !phoneValid || phoneOtp.isWaiting(phoneDraft)}
                          onPress={() => void sendPhoneCode()}
                        >
                          <Text style={styles.otpInlineText}>
                            {phoneSending
                              ? '…'
                              : otpSendLabel(
                                  phoneOtp.isSentTo(phoneDraft),
                                  phoneOtp.isWaiting(phoneDraft),
                                  phoneOtp.secondsLeft,
                                )}
                          </Text>
                        </Pressable>
                      ) : null}
                    </View>
                    {phoneChanging && !phoneVerified && phoneOtp.isSentTo(phoneDraft) ? (
                      <View style={styles.otpBlock}>
                        <Text style={styles.editHint}>
                          OTP has been sent to the WhatsApp account linked to +91 {phoneDraft.slice(0, 5)}{' '}
                          {phoneDraft.slice(5)}
                        </Text>
                        <OtpCodeBoxes
                          value={phoneCode}
                          onChange={setPhoneCode}
                          autoFocus
                          disabled={phoneVerifying}
                        />
                        <Pressable
                          style={[styles.otpBtnPrimary, (phoneBusy || phoneCode.length !== 6) && styles.disabled]}
                          disabled={phoneBusy || phoneCode.length !== 6}
                          onPress={() => void checkPhoneCode()}
                        >
                          <Text style={styles.otpBtnPrimaryText}>{phoneVerifying ? 'Checking…' : 'Verify'}</Text>
                        </Pressable>
                      </View>
                    ) : null}
                    {Platform.OS === 'android' && !phoneVerified ? (
                      <Pressable
                        style={[styles.truecallerVerify, phoneBusy && styles.disabled]}
                        disabled={phoneBusy}
                        onPress={() => void verifyWithTruecaller()}
                      >
                        {truecallerVerifying ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="call" size={14} color="#FFFFFF" />
                            <Text style={styles.truecallerVerifyText}>
                              {phoneChanging ? 'Verify with Truecaller instead' : 'Use my Truecaller number'}
                            </Text>
                          </>
                        )}
                      </Pressable>
                    ) : null}
                    {phoneHint ? <Text style={styles.emailHint}>{phoneHint}</Text> : null}
                    <Text style={styles.editHint}>
                      {phoneVerified
                        ? 'Number verified. Tap Save to keep it.'
                        : phoneChanging
                          ? 'A new number is saved only after you verify it on WhatsApp or with Truecaller.'
                          : 'To change your number, type the new one and verify it on WhatsApp or with Truecaller.'}
                    </Text>
                    </>
                    )}
                    {saveError ? (
                      <Text style={styles.saveError}>{saveError}</Text>
                    ) : null}
                    <View style={styles.editActions}>
                      <Pressable
                        onPress={() => setEditing(false)}
                        style={styles.editCancel}
                      >
                        <Text style={styles.editCancelText}>Cancel</Text>
                      </Pressable>
                      <PrimaryButton
                        label="Save"
                        onPress={() => void saveProfile()}
                        loading={saving}
                        style={styles.editSave}
                      />
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.guestCard}>
                <View style={styles.guestTop}>
                  <View style={styles.guestIcon}>
                    <Ionicons name="person" size={22} color={colors.success} />
                  </View>
                  <View style={styles.guestCopy}>
                    <Text style={styles.guestTitle}>Welcome to FinderB</Text>
                    <Text style={styles.guestSub}>
                      Save places, write reviews, and keep your activity in sync.
                    </Text>
                  </View>
                </View>
                <PrimaryButton
                  label="Sign in"
                  variant="success"
                  onPress={() => requestLogin('/(tabs)/account')}
                  style={styles.primaryBtn}
                />
                <Pressable
                  style={styles.linkBtn}
                  onPress={() => router.push('/signup')}
                >
                  <Text style={styles.linkBtnText}>Create account</Text>
                </Pressable>
              </View>
            )}

            {user?.isBusinessAccount ? (
              <Pressable
                style={styles.bizBanner}
                onPress={() => router.push('/merchant-welcome' as Href)}
              >
                <Ionicons name="storefront-outline" size={18} color="#F2B45A" />
                <View style={styles.bizCopy}>
                  <Text style={styles.bizTitle}>{user.businessName || 'Business account'}</Text>
                  <Text style={styles.bizBody}>
                    Open your business dashboard. Until it is fully in the app, manage your business on the web panel.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
              </Pressable>
            ) : null}

            <View style={styles.menuCard}>
              <View style={styles.menuItem}>
                <Text style={styles.menuTitle}>Dark mode</Text>
                <Switch
                  value={isDark}
                  onValueChange={() => toggleDark()}
                  trackColor={{ false: colors.borderStrong, true: '#2563EB' }}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor={colors.borderStrong}
                  accessibilityLabel="Dark mode"
                />
              </View>
              {menu.map((item) => (
                <Pressable
                  key={item.title}
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.menuItemBorder,
                    pressed && styles.menuPressed,
                  ]}
                  onPress={item.onPress}
                >
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.title === 'Notifications' && unreadCount > 0 ? (
                    <View style={styles.menuCount}>
                      <Text style={styles.menuCountText}>
                        {unreadCount > 9 ? '9+' : String(unreadCount)}
                      </Text>
                    </View>
                  ) : null}
                  <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
                </Pressable>
              ))}
              {user ? (
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    styles.menuItemBorder,
                    pressed && styles.menuPressed,
                  ]}
                  onPress={() => void signOut()}
                >
                  <Text style={[styles.menuTitle, styles.signOutTitle]}>Sign out</Text>
                </Pressable>
              ) : null}
            </View>

            {user ? (
              <Pressable
                onPress={() => router.push('/delete-account' as Href)}
                style={styles.deleteLink}
              >
                <Text style={styles.deleteLinkText}>Delete account</Text>
              </Pressable>
            ) : null}

            <View style={styles.legalRow}>
              <Pressable onPress={() => Linking.openURL(`${SITE_URL}/privacy`)}>
                <Text style={styles.legalText}>Privacy</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => Linking.openURL(`${SITE_URL}/data-safety`)}>
                <Text style={styles.legalText}>Data safety</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => Linking.openURL(`${SITE_URL}/terms`)}>
                <Text style={styles.legalText}>Terms</Text>
              </Pressable>
            </View>

            <Text style={styles.madeInIndia}>
              Proudly Made in India 🇮🇳 by FinderB Team
            </Text>
            <Text style={styles.appVersion}>{getAppVersionLabel()}</Text>
          </ScrollView>
        </SafeAreaView>
      </View>
    </TabSwipeHost>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas },
  header: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  profileCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
    gap: 12,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: colors.muted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 22,
    color: colors.white,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  avatarBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
    borderWidth: 2,
    borderColor: colors.white,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileName: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.heading,
  },
  profileMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  profileBusiness: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 17,
    color: '#B7791F',
  },
  businessNote: {
    marginTop: 12,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  editBlock: {
    gap: 8,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  editLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailInput: { flex: 1 },
  editInput: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSoft,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.ink,
  },
  lockedValue: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
    paddingVertical: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phonePrefix: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.heading,
    paddingHorizontal: 4,
  },
  phoneInput: {
    flex: 1,
  },
  saveError: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.heat,
  },
  editHint: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
    marginTop: -2,
    marginBottom: 2,
  },
  disabled: { opacity: 0.45 },
  otpInline: {
    minWidth: 76,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  otpInlineText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  otpBlock: { gap: 8, marginBottom: 4 },
  whatsappInline: { backgroundColor: '#128C7E' },
  truecallerVerify: {
    minHeight: 40,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0074E8',
  },
  truecallerVerifyText: { fontFamily: fonts.semiBold, fontSize: 13, color: '#FFFFFF' },
  otpActions: { flexDirection: 'row', gap: 8 },
  otpBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBtnText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.ink },
  otpBtnPrimary: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  otpBtnPrimaryText: { fontFamily: fonts.semiBold, fontSize: 13, color: colors.surface },
  emailHint: { fontFamily: fonts.medium, fontSize: 12, color: colors.success },
  editActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  editCancel: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  editCancelText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.textMuted,
  },
  editSave: {
    flex: 1,
  },
  bizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#12324A',
    marginBottom: 12,
  },
  bizCopy: {
    flex: 1,
    gap: 3,
    minWidth: 0,
  },
  bizTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: '#fff',
  },
  bizBody: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.78)',
  },
  guestCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.successBg,
    marginBottom: 16,
  },
  guestTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  guestIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestCopy: {
    flex: 1,
    gap: 4,
    minWidth: 0,
  },
  guestTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.heading,
  },
  guestSub: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  primaryBtn: {
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  linkBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.success,
  },
  menuCard: {
    borderRadius: 16,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  menuItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  menuPressed: {
    backgroundColor: colors.surfaceSoft,
  },
  menuIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  menuCopy: {
    flex: 1,
    gap: 1,
  },
  menuTitle: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  signOutTitle: {
    color: colors.heat,
  },
  menuCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    marginRight: 6,
  },
  menuCountText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: '#FFFFFF',
  },
  menuSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  deleteLinkText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSoft,
    textDecorationLine: 'underline',
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingBottom: 10,
  },
  legalText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSoft,
  },
  legalDot: {
    color: colors.textSoft,
  },
  madeInIndia: {
    textAlign: 'center',
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    paddingBottom: 2,
  },
  appVersion: {
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSoft,
    opacity: 0.75,
    paddingBottom: 8,
  },
}));
