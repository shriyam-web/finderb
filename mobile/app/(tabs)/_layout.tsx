import { Tabs } from 'expo-router';
import { AppTabBar } from '../../components/AppTabBar';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        // Custom tab bar owns bottom inset (3-button + gesture).
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="ai" options={{ title: 'FinderB AI' }} />
      <Tabs.Screen name="business" options={{ title: 'Business' }} />
      <Tabs.Screen name="account" options={{ title: 'Account' }} />
    </Tabs>
  );
}
