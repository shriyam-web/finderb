import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { Stack, useRouter, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Platform } from 'react-native';
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';
import { AuthProvider } from '../context/AuthContext';
import { LocationProvider } from '../context/LocationContext';
import { LoginPromptProvider } from '../context/LoginPromptContext';
import { NotificationInboxProvider } from '../context/NotificationInboxContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { scheduleWelcomeNotifications } from '../lib/welcomeNotifications';
import { registerDevicePushToken } from '../lib/pushNotifications';
import {
  configureNotificationHandler,
  ensureAndroidNotificationChannels,
} from '../lib/notificationChannels';
import * as Notifications from 'expo-notifications';
import { ensureWebFonts } from '../lib/webFonts';
import { warmupHomeSession } from '../lib/homeBootstrap';

configureNotificationHandler();
ensureWebFonts();

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

void warmupHomeSession().catch(() => undefined);

function RootNavigator() {
  const { colors } = useTheme();
  const router = useRouter();

  useEffect(() => {
    void ensureAndroidNotificationChannels();
    void registerDevicePushToken();
    const t = setTimeout(() => {
      void scheduleWelcomeNotifications();
      void registerDevicePushToken();
    }, 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      router.push('/(tabs)/notifications' as Href);
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
            name="notifications"
            options={{ animation: 'slide_from_right' }}
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
              </LocationProvider>
            </NotificationInboxProvider>
          </LoginPromptProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
