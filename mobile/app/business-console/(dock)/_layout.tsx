import { Tabs } from 'expo-router';
import { ConsoleDock } from '../../../components/console/ConsoleDock';
import { useConsoleColors } from '../../../constants/consoleColors';

export default function ConsoleDockLayout() {
  const c = useConsoleColors();
  return (
    <Tabs
      tabBar={(props) => <ConsoleDock {...props} />}
      backBehavior="history"
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
