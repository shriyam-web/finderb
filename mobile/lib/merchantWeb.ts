import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SITE_URL } from './supabase';

export const MERCHANT_LOGIN_URL = `${SITE_URL}/business/login`;

/**
 * finderb.com/business/* is a verified app link, so Linking.openURL would bounce straight back
 * into this app. A browser tab loads the website page itself.
 */
export async function openMerchantLogin(): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(MERCHANT_LOGIN_URL, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
    });
  } catch {
    await Linking.openURL(MERCHANT_LOGIN_URL).catch(() => undefined);
  }
}
