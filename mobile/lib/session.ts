import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'finderb_mobile_token';
const USER_KEY = 'finderb_mobile_user';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  avatarUrl?: string | null;
  authProvider?: string | null;
  /** ISO timestamp — used to hide broadcasts from before signup. */
  createdAt?: string | null;
  isBusinessAccount?: boolean;
  businessId?: string | null;
  businessName?: string | null;
  businessSlug?: string | null;
  selectedPlan?: string | null;
  paymentStatus?: string | null;
  planExpiresAt?: string | null;
  billingCycle?: string | null;
};

const memory = new Map<string, string>();

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.setItem(key, value);
    } catch {
      memory.set(key, value);
    }
    return;
  }
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    memory.set(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  }
  try {
    return (await SecureStore.getItemAsync(key)) ?? memory.get(key) ?? null;
  } catch {
    return memory.get(key) ?? null;
  }
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      memory.delete(key);
    }
    memory.delete(key);
    return;
  }
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // ignore
  }
  memory.delete(key);
}

export async function saveSession(token: string, user: AuthUser): Promise<void> {
  await setItem(TOKEN_KEY, token);
  await setItem(USER_KEY, JSON.stringify(user));
}

export async function clearSession(): Promise<void> {
  await deleteItem(TOKEN_KEY);
  await deleteItem(USER_KEY);
}

export async function getStoredToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
