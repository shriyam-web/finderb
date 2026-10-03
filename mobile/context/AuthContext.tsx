import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchSessionUser,
  loginWithGoogle,
  loginWithPassword,
  loginWithTruecaller,
  registerWithPassword,
  updateMobileProfile,
  type AuthResult,
} from '../lib/authApi';
import { clearGuestMode } from '../lib/onboarding';
import {
  clearSession,
  getStoredToken,
  getStoredUser,
  saveSession,
  type AuthUser,
} from '../lib/session';
import { registerDevicePushToken } from '../lib/pushNotifications';
import { stampNotificationSince } from '../lib/notificationInbox';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithTruecaller: () => Promise<AuthResult>;
  applyAuthResult: (result: AuthResult) => Promise<AuthResult>;
  updateProfile: (patch: {
    fullName?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string | null;
    emailVerificationToken?: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        setUser(null);
        return;
      }
      const stored = await getStoredUser();
      if (stored) setUser(stored);

      const remote = await fetchSessionUser(token);
      if (remote) {
        setUser(remote);
        await saveSession(token, remote);
        void registerDevicePushToken();
      } else if (!stored) {
        await clearSession();
        setUser(null);
      }
    } catch {
      // Keep whatever we already showed from storage.
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getStoredToken();
        if (!token) {
          if (!cancelled) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        const stored = await getStoredUser();
        if (cancelled) return;
        if (stored) setUser(stored);
        setLoading(false);
        const remote = await fetchSessionUser(token);
        if (cancelled) return;
        if (remote) {
          setUser(remote);
          await saveSession(token, remote);
          void registerDevicePushToken();
        } else if (!stored) {
          await clearSession();
          setUser(null);
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    const stuck = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 800);
    return () => {
      cancelled = true;
      clearTimeout(stuck);
    };
  }, []);

  const applySuccess = useCallback(async (result: AuthResult): Promise<AuthResult> => {
    if (!result.success) return result;
    try {
      await saveSession(result.token, result.user);
    } catch {
      return { success: false, error: 'Could not save your sign-in on this phone. Please try again.' };
    }
    setUser(result.user);
    await clearGuestMode().catch(() => undefined);
    if (result.isNewUser) {
      await stampNotificationSince(result.user.id, result.user.createdAt).catch(() => undefined);
    }
    void registerDevicePushToken();
    return result;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signIn: async (email, password) =>
        applySuccess(
          await loginWithPassword(email.trim().toLowerCase(), password.trim()),
        ),
      signUp: async (input) =>
        applySuccess(
          await registerWithPassword({
            ...input,
            email: input.email.trim().toLowerCase(),
            password: input.password.trim(),
          }),
        ),
      signInWithGoogle: async () => applySuccess(await loginWithGoogle()),
      signInWithTruecaller: async () => applySuccess(await loginWithTruecaller()),
      applyAuthResult: applySuccess,
      updateProfile: async (patch) => applySuccess(await updateMobileProfile(patch)),
      signOut: async () => {
        await clearSession();
        await clearGuestMode();
        setUser(null);
      },
      refresh,
    }),
    [user, loading, applySuccess, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
