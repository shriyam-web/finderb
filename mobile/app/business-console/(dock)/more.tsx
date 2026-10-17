import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, type Href } from 'expo-router';
import { setPreferredShell } from '../../../lib/preferredShell';
import { useConsoleColors } from '../../../constants/consoleColors';
import { fonts } from '../../../constants/typography';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import type { ConsoleOverview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import { FinderBQrStudio } from '../../../components/console/FinderBQrStudio';
import { ConsolePage, Panel, Row, createConsoleStyles, useTabBack } from '../../../components/console/kit';
import { canViewTeamTab } from '../../../lib/teamAccess';

const THEMES = [
  { key: 'light', label: 'Light', icon: 'sunny' },
  { key: 'dark', label: 'Dark', icon: 'moon' },
  { key: 'system', label: 'System default', icon: 'phone-portrait-outline' },
] as const;

function MoreBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const { refresh, refreshing } = useMerchantConsole();
  const sub = o.subscription;
  const verified = o.business.emailVerified && o.business.mobileVerified;
  const [qrOpen, setQrOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const selectedTheme = THEMES.find((theme) => theme.key === preference) ?? THEMES[2];
  const isOwner = o.actor?.isOwner !== false;
  const can = (tab: Parameters<typeof canViewTeamTab>[1]) => canViewTeamTab(o.actor?.access, tab, isOwner);
  const lastTool = can('jobs') ? 'jobs' : can('reviews') ? 'qr' : can('subscription') ? 'plan' : null;

  const logOut = () =>
    Alert.alert('Log out?', 'You can log back in with your business email or mobile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await setPreferredShell('user');
          await signOut();
          router.replace('/(tabs)/home' as Href);
        },
      },
    ]);

  const planLine = sub.isActive
    ? sub.planName
    : sub.isExpired
      ? 'Plan ended'
      : 'Free plan';

  return (
    <ConsolePage
      title="More"
      subtitle="Account and tools"
      onBack={back}
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      bodyStyle={{ gap: 10, paddingTop: 6 }}
    >
      <View style={styles.identity}>
        {o.photos.cover || o.photos.images[0] ? (
          <Image
            source={{ uri: o.photos.cover || o.photos.images[0] || '' }}
            style={styles.identityPhoto}
            contentFit="cover"
          />
        ) : (
          <View style={styles.identityMark}>
            <Text style={styles.identityLetter}>
              {(o.business.name || 'B').trim().charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={styles.flex}>
          <Text style={styles.identityName} numberOfLines={1}>
            {o.business.name}
          </Text>
          <Text style={styles.identityMeta} numberOfLines={1}>
            {[planLine, verified ? 'Verified' : 'Verification pending'].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      <Panel flush>
        {can('subscription') ? (
        <Row
          compact
          icon="card-outline"
          label="Plan and billing"
          value={sub.expiresAtDisplay ? `Till ${sub.expiresAtDisplay}` : planLine}
          tone={!sub.isActive || sub.alertLevel === 'urgent' ? 'warning' : undefined}
          onPress={() => router.push('/business-console/plan')}
          last={lastTool === 'plan'}
        />
        ) : null}
        {can('reviews') ? (
        <Row
          compact
          icon="qr-code-outline"
          label="FinderB review card"
          value="QR + download"
          onPress={() => setQrOpen(true)}
          last={lastTool === 'qr'}
        />
        ) : null}
        {can('jobs') ? (
        <Row
          compact
          icon="briefcase-outline"
          label="Jobs"
          value={o.stats.activeJobs ? String(o.stats.activeJobs) : undefined}
          onPress={() => router.push('/business-console/jobs')}
          last={lastTool === 'jobs'}
        />
        ) : null}
      </Panel>

      <Panel flush>
        <Row
          compact
          icon="shield-checkmark-outline"
          label="Login and security"
          value={verified ? 'Verified' : 'Action needed'}
          tone={verified ? undefined : 'warning'}
          onPress={() => router.push('/business-console/account')}
        />
        {isOwner ? (
          <Row
          compact
            icon="person-add-outline"
            label="Team access"
            value="Invite staff"
            onPress={() =>
              router.push({ pathname: '/business-console/account', params: { focus: 'team' } })
            }
          />
        ) : null}
        <Row
          compact
          icon="storefront-outline"
          label="Preview storefront"
          onPress={() =>
            Alert.alert('Preview storefront', 'Choose how this listing should open.', [
              {
                text: 'As your business',
                onPress: () =>
                  router.push({
                    pathname: '/(tabs)/merchant/[id]',
                    params: { id: o.business.id, preview: 'owner' },
                  }),
              },
              {
                text: 'As a visitor',
                onPress: () =>
                  router.push({
                    pathname: '/(tabs)/merchant/[id]',
                    params: { id: o.business.id, preview: 'visitor' },
                  }),
              },
              { text: 'Cancel', style: 'cancel' },
            ])
          }
          last
        />
      </Panel>

      <View style={styles.themeMenu}>
        <Pressable
          onPress={() => setThemeOpen((open) => !open)}
          style={styles.themeTrigger}
          accessibilityRole="button"
          accessibilityState={{ expanded: themeOpen }}
          accessibilityLabel={`Theme, ${selectedTheme.label}`}
        >
          <Ionicons name={selectedTheme.icon} size={18} color={c.ink} />
          <Text style={styles.themeValue}>{selectedTheme.label}</Text>
          <Ionicons name={themeOpen ? 'chevron-up' : 'chevron-down'} size={18} color={c.muted} />
        </Pressable>
        {themeOpen ? (
          <View style={styles.themeList}>
            {THEMES.map((theme) => {
              const active = preference === theme.key;
              return (
                <Pressable
                  key={theme.key}
                  onPress={() => {
                    setPreference(theme.key);
                    setThemeOpen(false);
                  }}
                  style={[styles.themeOption, active && styles.themeOptionActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Ionicons name={theme.icon} size={16} color={active ? c.primary : c.muted} />
                  <Text style={[styles.themeOptionText, active && styles.themeOptionTextActive]}>{theme.label}</Text>
                  {active ? <Ionicons name="checkmark" size={16} color={c.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <Panel flush>
        <Row
          compact
          icon="compass-outline"
          label="Browse FinderB"
          onPress={() => {
            void setPreferredShell('user').then(() => router.replace('/(tabs)/home' as Href));
          }}
          last
        />
      </Panel>

      <Pressable
        onPress={logOut}
        style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutPressed]}
        accessibilityRole="button"
        accessibilityLabel="Log out"
      >
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <FinderBQrStudio
        visible={qrOpen}
        businessName={o.business.name}
        category={o.business.category}
        city={o.business.city}
        slugOrId={o.business.slug || o.business.id}
        onClose={() => setQrOpen(false)}
      />
    </ConsolePage>
  );
}

export default function MoreScreen() {
  return <ConsoleGate>{(overview) => <MoreBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  identityPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: c.sunken,
  },
  identityLetter: { fontFamily: fonts.semiBold, fontSize: 15, color: c.primary },
  identityName: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  identityMeta: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  themeMenu: {
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    overflow: 'hidden',
  },
  themeTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  themeValue: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: c.ink },
  themeList: { borderTopWidth: 0.5, borderTopColor: c.line },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  themeOptionActive: { backgroundColor: c.primarySoft },
  themeOptionText: { flex: 1, fontFamily: fonts.regular, fontSize: 14.5, color: c.body },
  themeOptionTextActive: { fontFamily: fonts.semiBold, color: c.ink },
  logoutBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  logoutPressed: { opacity: 0.88 },
  logoutText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
}));
