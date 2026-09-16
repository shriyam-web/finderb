import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useNotificationInbox } from '../../context/NotificationInboxContext';
import { fonts } from '../../constants/typography';
import { useTheme } from '../../context/ThemeContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { SITE_URL } from '../../lib/supabase';
import { getAppVersionLabel } from '../../lib/appVersion';
import { TabSwipeHost } from '../../lib/tabSwipe';

type MenuItem = {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  ink: string;
  onPress: () => void;
};

const SUPPORT_EMAIL = 'support@finderb.com';

function providerMeta(provider?: string | null) {
  const p = (provider || '').toLowerCase();
  if (p === 'google') {
    return { label: 'Google', icon: 'logo-google' as const };
  }
  if (p === 'truecaller') {
    return { label: 'Truecaller', icon: 'call' as const };
  }
  if (p === 'password' || p === 'email') {
    return { label: 'Email', icon: 'mail-outline' as const };
  }
  if (p) {
    return {
      label: p.charAt(0).toUpperCase() + p.slice(1),
      icon: 'person-outline' as const,
    };
  }
  return { label: 'Email', icon: 'mail-outline' as const };
}

export default function AccountScreen() {
  const { colors, isDark, toggleDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user, loading, signOut, updateProfile } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const { unreadCount } = useNotificationInbox();
  const scrollBottomPad = useTabScrollPadding(28);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [phoneDraft, setPhoneDraft] = useState('');

  const startEdit = () => {
    if (!user) return;
    setNameDraft(user.fullName || '');
    setEmailDraft(user.email || '');
    setPhoneDraft(user.phone || '');
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const result = await updateProfile({
      fullName: nameDraft.trim(),
      email: emailDraft.trim() || undefined,
      phone: phoneDraft.trim() || undefined,
    });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Could not save', result.error);
      return;
    }
    setEditing(false);
  };

  const provider = providerMeta(user?.authProvider);

  const menu: MenuItem[] = [
    {
      title: 'Favourites',
      subtitle: 'Places you saved',
      icon: 'heart',
      tint: '#FDECEC',
      ink: '#C2410C',
      onPress: () => (user ? router.push('/favorites' as Href) : requestLogin('/favorites')),
    },
    {
      title: 'Saved blogs',
      subtitle: 'Articles you bookmarked',
      icon: 'bookmark',
      tint: '#EEF2FF',
      ink: '#4338CA',
      onPress: () => router.push('/saved-blogs' as Href),
    },
    {
      title: 'Notifications',
      subtitle: 'FinderB updates',
      icon: 'notifications',
      tint: '#FFF4E5',
      ink: '#C1621A',
      onPress: () => router.push('/(tabs)/notifications' as Href),
    },
    {
      title: 'For businesses',
      subtitle: 'List and grow on FinderB',
      icon: 'storefront',
      tint: '#ECFDF5',
      ink: '#047857',
      onPress: () => router.push('/business-app' as Href),
    },
    {
      title: 'Help & support',
      subtitle: 'Email the FinderB team',
      icon: 'chatbubbles',
      tint: '#F0F9FF',
      ink: '#0369A1',
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
          <ScreenHeader title="Your Account" variant="bar" />

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
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, styles.avatarFallback]}>
                      <Text style={styles.avatarInitial}>
                        {(user.fullName || 'U').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.profileCopy}>
                    <Text style={styles.profileName} numberOfLines={1}>
                      {user.fullName}
                    </Text>
                    <View style={styles.providerPill}>
                      <Ionicons name={provider.icon} size={12} color={colors.teal} />
                      <Text style={styles.providerText}>
                        Signed in with {provider.label}
                      </Text>
                    </View>
                  </View>
                  <Pressable style={styles.editBtn} onPress={startEdit} hitSlop={8}>
                    <Ionicons name="create-outline" size={18} color={colors.ink} />
                  </Pressable>
                </View>

                <View style={styles.detailRows}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {user.email?.trim() || 'Not added'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {user.phone?.trim() || 'Not added'}
                    </Text>
                  </View>
                </View>

                {editing ? (
                  <View style={styles.editBlock}>
                    <Text style={styles.editLabel}>Name</Text>
                    <TextInput
                      value={nameDraft}
                      onChangeText={setNameDraft}
                      style={styles.editInput}
                      placeholderTextColor={colors.textSoft}
                    />
                    <Text style={styles.editLabel}>Email</Text>
                    <TextInput
                      value={emailDraft}
                      onChangeText={setEmailDraft}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      style={styles.editInput}
                      placeholder="Add your email"
                      placeholderTextColor={colors.textSoft}
                    />
                    <Text style={styles.editLabel}>Phone</Text>
                    <TextInput
                      value={phoneDraft}
                      onChangeText={setPhoneDraft}
                      keyboardType="phone-pad"
                      style={styles.editInput}
                      placeholder="Add your phone"
                      placeholderTextColor={colors.textSoft}
                    />
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

                {user.isBusinessAccount ? (
                  <Pressable
                    style={styles.bizBanner}
                    onPress={() => router.push('/business-app' as Href)}
                  >
                    <Ionicons name="storefront-outline" size={18} color="#F2B45A" />
                    <View style={styles.bizCopy}>
                      <Text style={styles.bizTitle}>Business account</Text>
                      <Text style={styles.bizBody}>
                        You can use FinderB as usual. To manage{' '}
                        {user.businessName || 'your shop'}, download FinderB Business.
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color="rgba(255,255,255,0.7)"
                    />
                  </Pressable>
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

            <View style={styles.themeCard}>
              <View style={styles.themeIcon}>
                <Ionicons name="moon-outline" size={20} color={colors.accent} />
              </View>
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>Dark mode</Text>
                <Text style={styles.menuSub}>Easier on the eyes at night</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={() => toggleDark()}
                trackColor={{ false: colors.borderStrong, true: colors.accent }}
                thumbColor={isDark ? '#FAFAF9' : '#FFFFFF'}
                ios_backgroundColor={colors.borderStrong}
                accessibilityLabel="Dark mode"
              />
            </View>

            <View style={styles.menuCard}>
              {menu.map((item, index) => (
                <Pressable
                  key={item.title}
                  style={({ pressed }) => [
                    styles.menuItem,
                    index < menu.length - 1 && styles.menuItemBorder,
                    pressed && styles.menuPressed,
                  ]}
                  onPress={item.onPress}
                >
                  <View style={[styles.menuIcon, { backgroundColor: item.tint }]}>
                    <Ionicons name={item.icon} size={18} color={item.ink} />
                    {item.title === 'Notifications' && unreadCount > 0 ? (
                      <View style={styles.menuDot} />
                    ) : null}
                  </View>
                  <View style={styles.menuCopy}>
                    <Text style={styles.menuTitle}>{item.title}</Text>
                    {item.subtitle ? (
                      <Text style={styles.menuSub}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color={colors.textSoft}
                  />
                </Pressable>
              ))}
            </View>

            {user ? (
              <>
                <PrimaryButton
                  label="Sign out"
                  variant="secondary"
                  onPress={() => void signOut()}
                  style={styles.signOut}
                />
                <Pressable
                  onPress={() => router.push('/delete-account' as Href)}
                  style={styles.deleteLink}
                >
                  <Text style={styles.deleteLinkText}>Delete account</Text>
                </Pressable>
              </>
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
  safe: { flex: 1, backgroundColor: colors.canvas, paddingTop: 8 },
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  loadingBox: {
    paddingVertical: 28,
    alignItems: 'center',
  },
  profileCard: {
    padding: 16,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    gap: 14,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.muted,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  avatarInitial: {
    fontFamily: fonts.bold,
    fontSize: 24,
    color: colors.white,
  },
  profileCopy: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  profileName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.heading,
  },
  providerPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.tealSoft,
  },
  providerText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.teal,
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRows: {
    gap: 10,
    paddingTop: 2,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
    width: 52,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
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
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#12324A',
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
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 16,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  themeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 12,
  },
  menuItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  menuPressed: {
    backgroundColor: colors.surfaceSoft,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
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
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  menuSub: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  signOut: {
    marginBottom: 10,
  },
  deleteLink: {
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 16,
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
