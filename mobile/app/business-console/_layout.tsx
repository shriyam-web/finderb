import { useEffect } from 'react';
import { BackHandler, View } from 'react-native';
import { Stack, useRouter, type Href } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { MerchantConsoleProvider } from '../../context/MerchantConsoleContext';
import { useConsoleColors } from '../../constants/consoleColors';
import { ToastHost } from '../../components/console/kit';
import { MerchantSupportFab } from '../../components/console/MerchantSupportFab';
import { useConsoleBackAction } from '../../lib/consoleNav';
import { setPreferredShell } from '../../lib/preferredShell';

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
        <MerchantSupportFab />
        <ToastHost />
      </View>
    </MerchantConsoleProvider>
  );
}
