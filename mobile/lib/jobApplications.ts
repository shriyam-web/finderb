import AsyncStorage from '@react-native-async-storage/async-storage';

const APPLIED_KEY = '@finderb/job-applied-v1';

type AppliedMap = Record<string, { at: string; email?: string }>;

async function readMap(): Promise<AppliedMap> {
  try {
    const raw = await AsyncStorage.getItem(APPLIED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as AppliedMap) : {};
  } catch {
    return {};
  }
}

export async function hasAppliedToJob(jobId: string): Promise<boolean> {
  const id = jobId.trim();
  if (!id) return false;
  const map = await readMap();
  return Boolean(map[id]);
}

export async function getAppliedJobIds(): Promise<Set<string>> {
  const map = await readMap();
  return new Set(Object.keys(map).filter(Boolean));
}

export async function markJobApplied(
  jobId: string,
  email?: string,
): Promise<void> {
  const id = jobId.trim();
  if (!id) return;
  const map = await readMap();
  map[id] = {
    at: new Date().toISOString(),
    email: email?.trim() || undefined,
  };
  await AsyncStorage.setItem(APPLIED_KEY, JSON.stringify(map));
}
