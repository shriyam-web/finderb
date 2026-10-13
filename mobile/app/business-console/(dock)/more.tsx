import { Alert, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { openMerchantLogin } from '../../../lib/merchantWeb';
import type { ConsoleOverview } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import { ConsolePage, Panel, Row, Section, createConsoleStyles, useTabBack } from '../../../components/console/kit';

const THEMES = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
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
  const unread = o.notifications.unread;
  const verified = o.business.emailVerified && o.business.mobileVerified;

  const logOut = () =>
    Alert.alert('Log out?', 'You can log back in with your business email or mobile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(tabs)/home' as Href);
        },
      },
    ]);

  return (
    <ConsolePage
      title="More"
      subtitle={o.business.name}
      onBack={back}
      docked
      refreshing={refreshing}
      onRefresh={() => void refresh()}
    >
      <Section title="Business">
        <Panel flush>
          <Row
            icon="notifications-outline"
            label="Notifications"
            value={unread ? `${unread} unread` : 'Updates from FinderB'}
            tone={unread ? 'warning' : undefined}
            onPress={() => router.push('/business-console/alerts')}
          />
          <Row
            icon="card-outline"
            label="Plan & billing"
            value={
              sub.isActive
                ? `${sub.planName}${sub.expiresAtDisplay ? ` · till ${sub.expiresAtDisplay}` : ''}`
                : sub.isExpired
                  ? 'Plan ended · renew to unlock leads'
                  : 'Free plan · upgrade to unlock leads'
            }
            tone={!sub.isActive || sub.alertLevel === 'urgent' ? 'warning' : undefined}
            onPress={() => router.push('/business-console/plan')}
          />
          <Row
            icon="images-outline"
            label="Photos"
            value={`${o.photos.images.length} uploaded`}
            onPress={() => router.push('/business-console/photos')}
          />
          <Row
            icon="briefcase-outline"
            label="Jobs"
            value={o.stats.activeJobs ? `${o.stats.activeJobs} open` : 'Post a vacancy'}
            onPress={() => router.push('/business-console/jobs')}
            last
          />
        </Panel>
      </Section>

      <Section title="Account">
        <Panel flush>
          <Row
            icon="shield-checkmark-outline"
            label="Login & security"
            value={verified ? 'Email and mobile verified' : 'Verify your email and mobile'}
            tone={verified ? undefined : 'warning'}
            onPress={() => router.push('/business-console/account')}
          />
          <Row
            icon="globe-outline"
            label="Open on website"
            value="Same account in your browser"
            onPress={() => void openMerchantLogin()}
            last
          />
        </Panel>
      </Section>

      <Section title="Appearance">
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
                <Ionicons name={theme.icon} size={20} color={active ? c.primary : c.body} />
                <Text style={[styles.themeText, active && styles.themeTextActive]}>{theme.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </Section>

      <Panel flush>
        <Row
          icon="compass-outline"
          label="Browse FinderB"
          value="Switch to the customer app"
          onPress={() => router.replace('/(tabs)/home' as Href)}
        />
        <Row icon="log-out-outline" label="Log out" tone="danger" onPress={logOut} last />
      </Panel>
    </ConsolePage>
  );
}

export default function MoreScreen() {
  return <ConsoleGate>{(overview) => <MoreBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  themes: { flexDirection: 'row', gap: 10 },
  theme: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  themeActive: { backgroundColor: c.primarySoft, borderColor: c.primary },
  themeText: { fontFamily: fonts.regular, fontSize: 13, color: c.body },
  themeTextActive: { fontFamily: fonts.semiBold, color: c.primary },
}));
