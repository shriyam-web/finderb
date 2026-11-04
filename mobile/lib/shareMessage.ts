import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

/** Native share sheet when the platform has one. Otherwise copy the link. */
export async function shareMessage(input: {
  message: string;
  url?: string;
  title?: string;
}): Promise<'shared' | 'copied' | 'dismissed'> {
  const text = input.message;
  const url = input.url;
  if (Platform.OS === 'web') {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    if (nav && typeof nav.share === 'function') {
      try {
        await nav.share({ title: input.title, text, url });
        return 'shared';
      } catch (error) {
        const name = error instanceof Error ? error.name : '';
        if (name === 'AbortError') return 'dismissed';
      }
    }
    await Clipboard.setStringAsync(url || text);
    return 'copied';
  }
  try {
    const result = await Share.share({ message: text, url, title: input.title });
    if (result.action === Share.dismissedAction) return 'dismissed';
    return 'shared';
  } catch {
    await Clipboard.setStringAsync(url || text);
    return 'copied';
  }
}
