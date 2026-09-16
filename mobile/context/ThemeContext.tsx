import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import {
  darkColors,
  darkGradients,
  lightColors,
  lightGradients,
  type ColorTokens,
  type GradientTokens,
} from '../constants/colors';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  isDark: boolean;
  colors: ColorTokens;
  gradients: GradientTokens;
  setPreference: (next: ThemePreference) => void;
  toggleDark: () => void;
};

const STORAGE_KEY = '@finderb/theme-preference-v1';

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemScheme(): ResolvedTheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

function resolve(
  preference: ThemePreference,
  system: ResolvedTheme,
): ResolvedTheme {
  if (preference === 'system') return system;
  return preference;
}

function syncNativeChrome(isDark: boolean) {
  try {
    if (Platform.OS === 'android') {
      NavigationBar.setStyle(isDark ? 'light' : 'dark');
    }
  } catch {
    // ignore OEM failures
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>('light');
  const [system, setSystem] = useState<ResolvedTheme>(systemScheme);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (
          !cancelled &&
          (raw === 'light' || raw === 'dark' || raw === 'system')
        ) {
          setPreferenceState(raw);
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystem(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const resolved = resolve(preference, system);
  const isDark = resolved === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const gradients = isDark ? darkGradients : lightGradients;

  useEffect(() => {
    if (!hydrated) return;
    syncNativeChrome(isDark);
  }, [hydrated, isDark]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
  }, []);

  const toggleDark = useCallback(() => {
    setPreferenceState((prev) => {
      const currentlyDark = resolve(prev, systemScheme()) === 'dark';
      const next: ThemePreference = currentlyDark ? 'light' : 'dark';
      void AsyncStorage.setItem(STORAGE_KEY, next).catch(() => undefined);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      isDark,
      colors,
      gradients,
      setPreference,
      toggleDark,
    }),
    [
      preference,
      resolved,
      isDark,
      colors,
      gradients,
      setPreference,
      toggleDark,
    ],
  );

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={colors.statusBarStyle} />
      {Platform.OS === 'android' ? (
        <NavigationBar style={isDark ? 'light' : 'dark'} />
      ) : null}
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

/** Safe for optional early trees — falls back to light. */
export function useThemeColors(): ColorTokens {
  const ctx = useContext(ThemeContext);
  return ctx?.colors ?? lightColors;
}
