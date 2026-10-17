import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const KEY = 'finderb_preferred_shell';

export type PreferredShell = 'business' | 'user';

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

const listeners = new Set<(shell: PreferredShell) => void>();

export function subscribePreferredShell(listener: (shell: PreferredShell) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function setPreferredShell(shell: PreferredShell): Promise<void> {
  await setItem(KEY, shell);
  listeners.forEach((listener) => listener(shell));
}

export async function getPreferredShell(isBusinessAccount?: boolean): Promise<PreferredShell> {
  const stored = await getItem(KEY);
  if (stored === 'user' || stored === 'business') return stored;
  return isBusinessAccount ? 'business' : 'user';
}
