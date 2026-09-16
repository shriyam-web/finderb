import AsyncStorage from '@react-native-async-storage/async-storage';
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

export const SITE_URL =
  process.env.EXPO_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://finderb.com';
