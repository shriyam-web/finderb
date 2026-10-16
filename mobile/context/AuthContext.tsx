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
import { setPreferredShell } from '../lib/preferredShell';

type LoginRoleNotice = 'business' | 'user';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  loginRoleNotice: LoginRoleNotice | null;
  clearLoginRoleNotice: () => void;
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
    phoneVerificationToken?: string;
  }) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginRoleNotice, setLoginRoleNotice] = useState<LoginRoleNotice | null>(null);
  const clearLoginRoleNotice = useCallback(() => setLoginRoleNotice(null), []);

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

  const applySuccess = useCallback(async (result: AuthResult, announceRole = false): Promise<AuthResult> => {
    if (!result.success) return result;
    try {
      await saveSession(result.token, result.user);
    } catch {
      return { success: false, error: 'Could not save your sign-in on this phone. Please try again.' };
    }
    setUser(result.user);
    if (announceRole) {
      setLoginRoleNotice(result.user.isBusinessAccount ? 'business' : 'user');
    }
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
      loginRoleNotice,
      clearLoginRoleNotice,
      signIn: async (email, password) =>
        applySuccess(
          await loginWithPassword(email.trim().toLowerCase(), password.trim()),
          true,
        ),
      signUp: async (input) =>
        applySuccess(
          await registerWithPassword({
            ...input,
            email: input.email.trim().toLowerCase(),
            password: input.password.trim(),
          }),
          true,
        ),
      signInWithGoogle: async () => applySuccess(await loginWithGoogle(), true),
      signInWithTruecaller: async () => applySuccess(await loginWithTruecaller(), true),
      applyAuthResult: async (result) => applySuccess(result, true),
      updateProfile: async (patch) => applySuccess(await updateMobileProfile(patch)),
      signOut: async () => {
        setLoginRoleNotice(null);
        await clearSession();
        await clearGuestMode();
        await setPreferredShell('user').catch(() => undefined);
        setUser(null);
      },
      refresh,
    }),
    [user, loading, loginRoleNotice, clearLoginRoleNotice, applySuccess, refresh],
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
