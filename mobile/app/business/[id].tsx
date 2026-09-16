import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep-link / legacy path → keep tab bar by routing inside (tabs). */
export default function BusinessDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) {
    return <Redirect href="/(tabs)/home" />;
  }
  return <Redirect href={`/(tabs)/merchant/${id}`} />;
}
