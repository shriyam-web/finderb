import { Tabs } from 'expo-router';
import { AppTabBar } from '../../components/AppTabBar';
import { useTheme } from '../../context/ThemeContext';

export default function TabsLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      tabBar={(props) => <AppTabBar {...props} />}
      // Custom AppTabBar owns bottom inset for gesture + 3-button nav.
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          sceneStyle: { backgroundColor: colors.canvas },
        }}
      />
      <Tabs.Screen name="categories" options={{ title: 'Categories' }} />
      <Tabs.Screen name="ai" options={{ title: 'FinderB AI', tabBarLabel: 'AI' }} />
      <Tabs.Screen name="more" options={{ title: 'More' }} />
      <Tabs.Screen name="account" options={{ title: 'Your Account' }} />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
          title: 'Notifications',
        }}
      />
      <Tabs.Screen
        name="business"
        options={{
          href: null,
          title: 'Business',
        }}
      />
      <Tabs.Screen
        name="merchant/[id]"
        options={{
          href: null,
          title: 'Merchant',
        }}
      />
      <Tabs.Screen
        name="category/[slug]"
        options={{
          href: null,
          title: 'Category',
        }}
      />
      <Tabs.Screen
        name="blog/index"
        options={{
          href: null,
          title: 'Blog',
        }}
      />
      <Tabs.Screen
        name="blog/[slug]"
        options={{
          href: null,
          title: 'Article',
        }}
      />
      <Tabs.Screen
        name="tourist-places/index"
        options={{
          href: null,
          title: 'Destinations',
        }}
      />
      <Tabs.Screen
        name="tourist-places/[slug]"
        options={{
          href: null,
          title: 'Destination',
        }}
      />
      <Tabs.Screen
        name="jobs/index"
        options={{
          href: null,
          title: 'Jobs',
        }}
      />
      <Tabs.Screen
        name="jobs/[id]"
        options={{
          href: null,
          title: 'Job',
        }}
      />
      <Tabs.Screen
        name="news/index"
        options={{
          href: null,
          title: 'News',
        }}
      />
      <Tabs.Screen
        name="news/article"
        options={{
          href: null,
          title: 'Story',
        }}
      />
    </Tabs>
  );
}
