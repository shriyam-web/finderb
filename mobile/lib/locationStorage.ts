import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserCoords } from '../hooks/useUserLocation';

const STORAGE_KEY = 'finderb_user_location_v2';

export type StoredUserLocation = {
  source: 'gps' | 'manual';
  city: string | null;
  area?: string | null;
  region: string | null;
  coords: UserCoords | null;
  updatedAt: number;
};

export async function loadStoredLocation(): Promise<StoredUserLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserLocation;
    if (!parsed || typeof parsed !== 'object') return null;
    if (parsed.source !== 'gps' && parsed.source !== 'manual') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function saveStoredLocation(
  value: StoredUserLocation,
): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore persistence failures
  }
}

export async function clearStoredLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
