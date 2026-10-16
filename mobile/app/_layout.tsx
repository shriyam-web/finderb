import 'react-native-gesture-handler';
import '../lib/installLongFetch';
import { useEffect } from 'react';
import { Stack, useRouter, useSegments, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { LoginRoleToast } from '../components/LoginRoleToast';
import { LocationProvider } from '../context/LocationContext';
import { LoginPromptProvider } from '../context/LoginPromptContext';
import { NotificationInboxProvider } from '../context/NotificationInboxContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import {
  cancelWelcomeNotifications,
  scheduleWelcomeNotifications,
} from '../lib/welcomeNotifications';
import { registerDevicePushToken } from '../lib/pushNotifications';
import {
  configureNotificationHandler,
  ensureAndroidNotificationChannels,
  isBusinessNotification,
  setNotificationAudience,
} from '../lib/notificationChannels';
import { consoleRouteFor } from '../components/console/routes';
import * as Notifications from 'expo-notifications';
import { ensureWebFonts } from '../lib/webFonts';
import { warmupHomeSession } from '../lib/homeBootstrap';
import { isMobileGateSkipped } from '../lib/mobileGate';
import { getPreferredShell } from '../lib/preferredShell';

configureNotificationHandler();
ensureWebFonts();

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

void warmupHomeSession().catch(() => undefined);

/** Screens a signed-in customer without a verified mobile can still reach. */
const MOBILE_GATE_OPEN = new Set([
  'verify-phone',
  'index',
  'welcome',
  'login',
  'signup',
  'auth',
  'forgot-password',
  'reset-password',
  'delete-account',
  'merchant-welcome',
  'business-console',
  'business-app',
  'business',
  'business-login',
  'business-register',
]);

function notificationTarget(data: Record<string, unknown> | undefined): Href {
  if (!isBusinessNotification(data)) return '/(tabs)/notifications' as Href;
  const reviewId = typeof data?.reviewId === 'string' ? data.reviewId.trim() : '';
  if (data?.type === 'ownership') return '/business-console/alerts';
  if (data?.type === 'lead') return '/business-console/leads';
  if (data?.type === 'review') {
    return reviewId
      ? ({ pathname: '/business-console/reviews', params: { reviewId } } as Href)
      : '/business-console/reviews';
  }
  const url = typeof data?.ctaUrl === 'string' ? data.ctaUrl : typeof data?.url === 'string' ? data.url : '';
  return (url && consoleRouteFor(url)) || '/business-console/alerts';
}

function hasIndianMobile(phone: string | null | undefined) {
  const digits = (phone || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits);
}

function RootNavigator() {
  const { colors } = useTheme();
  const router = useRouter();
  const segments: string[] = useSegments();
  const { user, loading } = useAuth();
  const needsMobile = Boolean(user && !user.isBusinessAccount && !hasIndianMobile(user.phone));
  const gateOpen = segments.length === 0 || segments.some((segment) => MOBILE_GATE_OPEN.has(segment));

  useEffect(() => {
    if (loading || !needsMobile || gateOpen || isMobileGateSkipped(user?.id)) return;
    router.replace('/verify-phone' as Href);
  }, [gateOpen, loading, needsMobile, router, user?.id]);

  const isMerchant = Boolean(user?.isBusinessAccount);

  useEffect(() => {
    if (loading || !isMerchant) return;
    if (segments[0] !== '(tabs)') return;
    const tab = segments[1];
    if (tab && tab !== 'home') return;
    void getPreferredShell(true).then((shell) => {
      if (shell === 'business') router.replace('/business-console' as Href);
    });
  }, [isMerchant, loading, router, segments]);

  useEffect(() => {
    void ensureAndroidNotificationChannels();
  }, []);

  /* Re-registers on every sign-in/out so the server knows whether this device is a merchant's. */
  useEffect(() => {
    if (loading) return;
    setNotificationAudience(isMerchant ? 'business' : 'user');
    if (isMerchant) void cancelWelcomeNotifications();
    void registerDevicePushToken();
    const t = setTimeout(() => {
      if (!isMerchant) void scheduleWelcomeNotifications();
      void registerDevicePushToken();
    }, 2500);
    return () => clearTimeout(t);
  }, [loading, isMerchant, user?.id]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown> | undefined;
      router.push(notificationTarget(data));
    });
    return () => sub.remove();
  }, [router]);

  return (
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.canvas },
            animation: 'fade',
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen
            name="welcome"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="login"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="auth/callback"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="signup"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="forgot-password"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="reset-password"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="favorites"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="saved-blogs"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="delete-account"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="business-app"
            options={{ animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="merchant-welcome"
            options={{ animation: 'fade' }}
          />
          <Stack.Screen
            name="business-console"
            options={{ animation: 'fade', gestureEnabled: false }}
          />
          <Stack.Screen
            name="review/[slug]"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="notifications"
            options={{ animation: 'slide_from_right' }}
          />
          <Stack.Screen
            name="verify-phone"
            options={{ animation: 'fade', gestureEnabled: false }}
          />
        </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void import('@expo-google-fonts/plus-jakarta-sans')
      .then((jakarta) =>
        Font.loadAsync({
          PlusJakartaSans_400Regular: jakarta.PlusJakartaSans_400Regular,
          PlusJakartaSans_500Medium: jakarta.PlusJakartaSans_500Medium,
          PlusJakartaSans_600SemiBold: jakarta.PlusJakartaSans_600SemiBold,
          PlusJakartaSans_700Bold: jakarta.PlusJakartaSans_700Bold,
          PlusJakartaSans_800ExtraBold: jakarta.PlusJakartaSans_800ExtraBold,
        }),
      )
      .catch(() => undefined);
  }, []);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <AuthProvider>
          <LoginPromptProvider>
            <NotificationInboxProvider>
              <LocationProvider>
                <RootNavigator />
                <LoginRoleToast />
              </LocationProvider>
            </NotificationInboxProvider>
          </LoginPromptProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
