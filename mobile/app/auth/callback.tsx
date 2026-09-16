import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { SITE_URL, supabase } from '../../lib/supabase';
import type { AuthResult } from '../../lib/authApi';
import type { AuthUser } from '../../lib/session';

/**
 * Deep-link landing for Google OAuth (`finderb://auth/callback`).
 * Completes PKCE / session exchange then hits FinderB mobile oauth API.
 */
export default function AuthCallbackScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const routeParams = useLocalSearchParams<{
    code?: string;
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
  }>();
  const { applyAuthResult } = useAuth();
  const [message, setMessage] = useState('Finishing sign-in…');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!supabase) {
          setMessage('Sign-in is not configured.');
          setTimeout(() => router.replace('/login'), 900);
          return;
        }

        const href =
          (await Linking.getInitialURL()) || Linking.getLinkingURL() || '';

        const fromUrl = href ? QueryParams.getQueryParams(href) : null;
        const code =
          (typeof routeParams.code === 'string' && routeParams.code) ||
          fromUrl?.params.code ||
          '';
        const accessFromRoute =
          (typeof routeParams.access_token === 'string' &&
            routeParams.access_token) ||
          fromUrl?.params.access_token ||
          '';
        const refreshFromRoute =
          (typeof routeParams.refresh_token === 'string' &&
            routeParams.refresh_token) ||
          fromUrl?.params.refresh_token ||
          '';
        const errorCode =
          routeParams.error_description ||
          routeParams.error ||
          fromUrl?.errorCode;

        if (errorCode) {
          setMessage(
            typeof errorCode === 'string'
              ? errorCode
              : 'Google sign-in failed.',
          );
          setTimeout(() => router.replace('/login'), 1200);
          return;
        }

        let accessToken = accessFromRoute;
        if (accessToken && refreshFromRoute) {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshFromRoute,
          });
        } else if (code) {
          const exchanged =
            await supabase.auth.exchangeCodeForSession(code);
          if (exchanged.error) {
            const { data: existing } = await supabase.auth.getSession();
            accessToken = existing.session?.access_token || '';
            if (!accessToken) {
              setMessage(
                /code verifier|pkce/i.test(exchanged.error.message || '')
                  ? 'Sign-in session expired. Please try Google again.'
                  : exchanged.error.message || 'Could not finish Google sign-in.',
              );
              setTimeout(() => router.replace('/login'), 1200);
              return;
            }
          } else {
            accessToken = exchanged.data.session?.access_token || '';
          }
        }

        if (!accessToken) {
          const { data } = await supabase.auth.getSession();
          accessToken = data.session?.access_token || '';
        }

        if (!accessToken) {
          setMessage('Google did not return a session. Please try again.');
          setTimeout(() => router.replace('/login'), 1200);
          return;
        }

        const res = await fetch(`${SITE_URL}/api/auth/mobile/oauth`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ accessToken }),
        });
        const data = (await res.json()) as AuthResult & {
          token?: string;
          user?: AuthUser;
        };

        await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);

        if (!data.success || !data.token || !data.user) {
          setMessage(
            data.success === false ? data.error : 'Could not complete sign-in.',
          );
          setTimeout(() => router.replace('/login'), 1200);
          return;
        }

        await applyAuthResult({
          success: true,
          token: data.token,
          user: data.user,
          isNewUser: data.isNewUser,
        });

        if (!cancelled) router.replace('/(tabs)/home');
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : 'Could not complete sign-in.',
          );
          setTimeout(() => router.replace('/login'), 1200);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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
