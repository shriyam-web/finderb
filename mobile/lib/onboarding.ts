import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const GUEST_KEY = 'finderb_continue_as_guest';

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
  await SecureStore.setItemAsync(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(key) ?? memory.get(key) ?? null;
    } catch {
      return memory.get(key) ?? null;
    }
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (Platform.OS === 'web') {
    try {
      globalThis.localStorage?.removeItem(key);
    } catch {
      // ignore
    }
    memory.delete(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

export async function hasChosenGuest(): Promise<boolean> {
  const value = await getItem(GUEST_KEY);
  return value === '1';
}

export async function markGuestMode(): Promise<void> {
  await setItem(GUEST_KEY, '1');
}

export async function clearGuestMode(): Promise<void> {
  await deleteItem(GUEST_KEY);
}
