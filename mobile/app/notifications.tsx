import { Redirect, type Href } from 'expo-router';

export default function NotificationsRedirect() {
  return <Redirect href={'/(tabs)/notifications' as Href} />;
}
