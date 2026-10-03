import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { Href, usePathname, useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

type LoginPromptContextValue = {
  requestLogin: (returnTo?: string) => void;
};

const LoginPromptContext = createContext<LoginPromptContextValue | null>(null);

/** Survives backgrounding. Clears only when the JS process restarts. */
let promptedThisSession = false;

const PROMPT_BLOCKED = [
  '/login',
  '/signup',
  '/welcome',
  '/business-login',
  '/business-register',
  '/(tabs)/business-login',
  '/(tabs)/business-register',
  '/merchant-welcome',
  '/forgot-password',
  '/reset-password',
];

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const userRef = useRef(user);
  const pathRef = useRef(pathname);
  userRef.current = user;
  pathRef.current = pathname;

  useEffect(() => {
    if (user) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let alive = true;

    const clearTimer = () => {
      if (!timer) return;
      clearTimeout(timer);
      timer = null;
    };

    const schedule = () => {
      clearTimer();
      if (!alive || promptedThisSession || userRef.current) return;
      timer = setTimeout(() => {
        if (!alive || promptedThisSession || userRef.current) return;
        const path = pathRef.current || '';
        if (path === '/login' || path.startsWith('/login/')) {
          promptedThisSession = true;
          return;
        }
        const blocked = PROMPT_BLOCKED.some(
          (prefix) => path === prefix || path.startsWith(`${prefix}/`),
        );
        if (blocked) {
          schedule();
          return;
        }
        promptedThisSession = true;
        router.push({
          pathname: '/login',
          params: { fromPrompt: '1' },
        } as Href);
      }, 30000);
    };

    schedule();
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        clearTimer();
        return;
      }
      if (next === 'active') schedule();
    });

    return () => {
      alive = false;
      clearTimer();
      sub.remove();
    };
  }, [router, user]);

  const requestLogin = useCallback(
    (next?: string) => {
      if (user) return;
      router.push({
        pathname: '/login',
        params: next ? { returnTo: next } : {},
      } as Href);
    },
    [router, user],
  );

  const value = useMemo(() => ({ requestLogin }), [requestLogin]);

  return (
    <LoginPromptContext.Provider value={value}>{children}</LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) {
    throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  }
  return ctx;
}
