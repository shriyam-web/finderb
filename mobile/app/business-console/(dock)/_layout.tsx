import { useEffect } from 'react';
import { Tabs, useSegments } from 'expo-router';
import { ConsoleDock } from '../../../components/console/ConsoleDock';
import { useConsoleColors } from '../../../constants/consoleColors';
import { rememberDockTab } from '../../../lib/consoleNav';

export default function ConsoleDockLayout() {
  const c = useConsoleColors();
  const segments = useSegments();

  useEffect(() => {
    if (segments[0] === 'business-console' && segments[1] === '(dock)') {
      rememberDockTab(segments[2] || 'index');
    }
  }, [segments]);

  return (
    <Tabs
      tabBar={(props) => <ConsoleDock {...props} />}
      backBehavior="none"
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: c.page },
        tabBarHideOnKeyboard: true,
        animation: 'shift',
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="leads" options={{ title: 'Leads' }} />
      <Tabs.Screen name="listing" options={{ title: 'Listing' }} />
      <Tabs.Screen name="reviews" options={{ title: 'Reviews' }} />
      <Tabs.Screen name="subscription" options={{ title: 'Plan' }} />
      <Tabs.Screen name="more" options={{ href: null, title: 'More' }} />
    </Tabs>
  );
}
