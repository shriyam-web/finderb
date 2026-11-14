import { useEffect, useRef } from 'react';
import { BackHandler, View } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MerchantConsoleProvider, useMerchantConsole } from '../../context/MerchantConsoleContext';
import { useConsoleColors } from '../../constants/consoleColors';
import { StackConsoleDock } from '../../components/console/ConsoleDock';
import { BusinessSplash } from '../../components/console/BusinessSplash';
import { finishConsoleSplash, useConsoleSplash } from '../../components/console/consoleSplash';
import { ToastHost } from '../../components/console/kit';
import { useConsoleBackAction } from '../../lib/consoleNav';
import { setPreferredShell } from '../../lib/preferredShell';

const MIN_SPLASH_MS = 1500;

function ConsoleSplashOverlay() {
  const splashOn = useConsoleSplash();
  const { overview, loading, error } = useMerchantConsole();
  const started = useRef(Date.now());

  useEffect(() => {
    if (!splashOn) return;
    if (loading && !overview && !error) return;
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - started.current));
    const timer = setTimeout(() => finishConsoleSplash(), wait);
    return () => clearTimeout(timer);
  }, [splashOn, loading, overview, error]);

  if (!splashOn) return null;
  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 40, elevation: 40 }}>
      <BusinessSplash />
    </View>
  );
}

function ConsoleBackLock() {
  const goBack = useConsoleBackAction();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => goBack('hardware'));
    return () => sub.remove();
  }, [goBack]);

  return null;
}

export default function BusinessConsoleLayout() {
  const c = useConsoleColors();
  const router = useRouter();
  const { user, loading } = useAuth();
  const isMerchant = Boolean(user?.isBusinessAccount);

  useEffect(() => {
    if (isMerchant) void setPreferredShell('business');
  }, [isMerchant]);

  useEffect(() => {
    if (loading || isMerchant) return;
    router.replace((user ? '/business-app' : '/(tabs)/business-login') as Href);
  }, [isMerchant, loading, router, user]);

  if (!isMerchant) return <View style={{ flex: 1, backgroundColor: c.page }} />;

  return (
    <MerchantConsoleProvider>
      <View style={{ flex: 1, backgroundColor: c.page }}>
        <ConsoleBackLock />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: c.page },
            animation: 'slide_from_right',
            gestureEnabled: false,
          }}
        >
          <Stack.Screen name="(dock)" options={{ animation: 'fade' }} />
          <Stack.Screen name="plan" options={{ animation: 'slide_from_bottom' }} />
        </Stack>
        <StackConsoleDock />
        <ConsoleSplashOverlay />
        <ToastHost />
      </View>
    </MerchantConsoleProvider>
  );
}
