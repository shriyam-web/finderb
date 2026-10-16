import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * PKCE code_verifier must survive Custom Tabs / browser hops.
 * SecureStore alone can fail on some Android OEMs during backgrounding,
 * so we mirror to AsyncStorage + in-memory.
 */
const memory = new Map<string, string>();

const authStorage: SupportedStorage = {
  getItem: async (key) => {
    if (memory.has(key)) return memory.get(key) ?? null;
    try {
      if (Platform.OS !== 'web') {
        const secure = await SecureStore.getItemAsync(key);
        if (secure != null) {
          memory.set(key, secure);
          return secure;
        }
      }
    } catch {
      // fall through
    }
    try {
      const asyncVal = await AsyncStorage.getItem(key);
      if (asyncVal != null) memory.set(key, asyncVal);
      return asyncVal;
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    memory.set(key, value);
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      // ignore
    }
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.setItemAsync(key, value);
      } catch {
        // ignore
      }
    }
  },
  removeItem: async (key) => {
    memory.delete(key);
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // ignore
    }
    if (Platform.OS !== 'web') {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch {
        // ignore
      }
    }
  },
};

/**
 * Persist auth storage so PKCE code_verifier survives the OAuth browser hop.
 */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: authStorage,
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
    })
  : null;

function localDevSiteUrl() {
  const raw = [
    Constants.expoConfig?.hostUri,
    (Constants as { expoGoConfig?: { debuggerHost?: string } }).expoGoConfig?.debuggerHost,
    Constants.linkingUri,
  ]
    .filter(Boolean)
    .join(' ');
  const host = raw
    .replace(/^exp:\/\//, '')
    .replace(/^https?:\/\//, '')
    .split(/[/:?]/)[0]
    .replace(/^\[|\]$/g, '');
  if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '::1') {
    return `http://${host}:3200`;
  }
  if (Platform.OS === 'android') return 'http://10.0.2.2:3200';
  return 'http://localhost:3200';
}

function isPrivateSite(url: string) {
  return /localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[0-1])\./.test(url);
}

const envSite = process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || '';

/** Release builds talk to finderb.com. Expo/dev always uses the local Next server on :3200. */
export const SITE_URL =
  typeof __DEV__ !== 'undefined' && __DEV__
    ? isPrivateSite(envSite)
      ? envSite
      : localDevSiteUrl()
    : envSite || 'https://finderb.com';
