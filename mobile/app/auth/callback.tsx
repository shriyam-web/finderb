import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { supabase } from '../../lib/supabase';
import { completeGoogleRedirect, isGoogleLoginActive } from '../../lib/authApi';
import { getStoredToken, getStoredUser } from '../../lib/session';

const CALLBACK_PARAMS = ['code', 'access_token', 'refresh_token', 'error', 'error_description'] as const;

/**
 * Deep-link landing for Google OAuth (`finderb://auth/callback`).
 * Shares the single code exchange with the login screen's own Google flow.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const routeParams = useLocalSearchParams<Record<(typeof CALLBACK_PARAMS)[number], string>>();
  const { applyAuthResult } = useAuth();
  const [message, setMessage] = useState('Finishing sign-in…');
  const started = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Runs once: the screen re-renders as sign-in updates auth state, and a second run
    // would try to reuse the one-time code.
    if (started.current) return;
    started.current = true;

    const leave = (path: '/login' | '/(tabs)/home' | '/merchant-welcome', delay = 0) => {
      setTimeout(() => {
        if (mounted.current) router.replace(path);
      }, delay);
    };

    const fail = async (text: string) => {
      // The login screen's flow may have finished sign-in through the same code.
      if (await getStoredToken()) {
        const user = await getStoredUser();
        leave(user?.isBusinessAccount ? '/merchant-welcome' : '/(tabs)/home');
        return;
      }
      if (mounted.current) setMessage(text);
      leave('/login', 1400);
    };

    (async () => {
      try {
        if (!supabase) {
          await fail('Sign-in is not configured.');
          return;
        }

        // Route params belong to this very link; the launch URL can be an older one.
        const query = new URLSearchParams();
        for (const key of CALLBACK_PARAMS) {
          const value = routeParams[key];
          if (typeof value === 'string' && value) query.set(key, value);
        }
        const href = Linking.getLinkingURL() || (await Linking.getInitialURL()) || '';
        const url = query.toString()
          ? `finderb://auth/callback?${query.toString()}`
          : href;

        const fromLoginScreen = isGoogleLoginActive();
        const result = await completeGoogleRedirect(url);

        if (fromLoginScreen) {
          // The login screen (user or Business tab) applies the result and navigates, which
          // replaces this screen. If it is still here afterwards, follow what it decided.
          setTimeout(() => {
            void (async () => {
              if (!mounted.current) return;
              if (await getStoredToken()) {
                const user = await getStoredUser();
                leave(user?.isBusinessAccount ? '/merchant-welcome' : '/(tabs)/home');
              } else if (router.canGoBack()) {
                router.back();
              } else {
                leave('/login');
              }
            })();
          }, 2500);
          return;
        }

        if (!result.success) {
          await fail(result.error || 'Could not complete sign-in.');
          return;
        }

        await applyAuthResult(result);
        leave(result.user.isBusinessAccount ? '/merchant-welcome' : '/(tabs)/home');
      } catch (error) {
        await fail(error instanceof Error ? error.message : 'Could not complete sign-in.');
      }
    })();
  }, [applyAuthResult, routeParams, router]);

  return (
    <View style={styles.root}>
      <ActivityIndicator color={colors.brand} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: colors.canvas,
    padding: 24,
  },
  text: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
}));
