import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { setPreferredShell } from '../../../lib/preferredShell';
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
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'System' },
] as const;

function MoreBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const router = useRouter();
  const back = useTabBack();
  const { signOut } = useAuth();
  const { preference, setPreference } = useTheme();
  const { refresh, refreshing } = useMerchantConsole();
  const sub = o.subscription;
  const verified = o.business.emailVerified && o.business.mobileVerified;
  const [qrOpen, setQrOpen] = useState(false);
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
    >
      <View style={styles.identity}>
        <View style={styles.identityMark}>
          <Text style={styles.identityLetter}>
            {(o.business.name || 'B').trim().charAt(0).toUpperCase()}
          </Text>
        </View>
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
          icon="qr-code-outline"
          label="FinderB review card"
          value="QR + download"
          onPress={() => setQrOpen(true)}
          last={lastTool === 'qr'}
        />
        ) : null}
        {can('jobs') ? (
        <Row
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
          icon="shield-checkmark-outline"
          label="Login and security"
          value={verified ? 'Verified' : 'Action needed'}
          tone={verified ? undefined : 'warning'}
          onPress={() => router.push('/business-console/account')}
        />
        <Row
          icon="storefront-outline"
          label="Preview storefront"
          onPress={() =>
            router.push({
              pathname: '/(tabs)/merchant/[id]',
              params: { id: o.business.id, preview: '1' },
            })
          }
          last
        />
      </Panel>

      <View style={styles.themeBlock}>
        <Text style={styles.themeLabel}>Appearance</Text>
        <View style={styles.themes}>
          {THEMES.map((theme) => {
            const active = preference === theme.key;
            return (
              <Pressable
                key={theme.key}
                onPress={() => setPreference(theme.key)}
                style={[styles.theme, active && styles.themeActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${theme.label} theme`}
              >
                <Text style={[styles.themeText, active && styles.themeTextActive]}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Panel flush>
        <Row
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
    gap: 12,
    paddingVertical: 4,
  },
  identityMark: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  identityLetter: { fontFamily: fonts.semiBold, fontSize: 18, color: c.primary },
  identityName: { fontFamily: fonts.semiBold, fontSize: 17, color: c.ink },
  identityMeta: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  themeBlock: { gap: 8 },
  themeLabel: { fontFamily: fonts.medium, fontSize: 12, color: c.muted },
  themes: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 10,
    backgroundColor: c.sunken,
  },
  theme: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  themeActive: { backgroundColor: c.card },
  themeText: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  themeTextActive: { fontFamily: fonts.semiBold, color: c.ink },
  logoutBtn: {
    marginTop: 8,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  logoutPressed: { opacity: 0.88 },
  logoutText: { fontFamily: fonts.semiBold, fontSize: 15.5, color: '#FFFFFF' },
}));
