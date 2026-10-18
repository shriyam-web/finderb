import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Linking from 'expo-linking';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { safeUserError } from './safeError';
import { SITE_URL, supabase } from './supabase';
import type { AuthUser } from './session';

WebBrowser.maybeCompleteAuthSession();

type AuthSuccess = {
  success: true;
  token: string;
  user: AuthUser;
  isNewUser?: boolean;
};

type AuthFailure = {
  success: false;
  error: string;
  suggestedLoginPath?: string;
};

export type AuthResult = AuthSuccess | AuthFailure;

/**
 * App deep-link AuthSession waits for.
 * Host form (`finderb://auth/callback`) matches Supabase / Custom Tabs handoff.
 * Triple-slash form is also accepted when the HTTPS bridge prefers it.
 */
const APP_CALLBACK = 'finderb://auth/callback';
const APP_CALLBACK_ALT = 'finderb:///auth/callback';

/** Each Google sign-in step gets this long; a stalled step must never leave the loader spinning. */
const STEP_TIMEOUT_MS = 20000;
const SERVER_TIMEOUT_MS = 25000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

async function postJson<T>(
  path: string,
  body: Record<string, unknown>,
  timeoutMs?: number,
): Promise<T> {
  const controller = timeoutMs ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
  try {
    const res = await fetch(`${SITE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller?.signal,
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as T;
    } catch {
      return {
        success: false,
        error: 'FinderB could not be reached. Try again in a moment.',
      } as T;
    }
  } catch (error) {
    return {
      success: false,
      error: controller?.signal.aborted
        ? 'FinderB took too long to answer. Check your internet and try again.'
        : safeUserError(error, 'Network error. Check your connection.'),
    } as T;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export type WhatsAppAudience = 'user' | 'business';

export async function requestWhatsAppOtp(
  phone: string,
  audience: WhatsAppAudience,
): Promise<{ success: true; message: string } | AuthFailure> {
  return postJson('/api/auth/whatsapp/otp', { phone, audience, client: 'mobile' });
}

export async function verifyWhatsAppOtp(
  phone: string,
  code: string,
  audience: WhatsAppAudience,
): Promise<AuthResult> {
  return postJson('/api/auth/whatsapp/otp', { phone, code, audience, client: 'mobile' });
}

async function authedJson<T>(
  path: string,
  init: { method: 'GET' | 'POST'; body?: Record<string, unknown> },
): Promise<T | null> {
  try {
    const { getStoredToken } = await import('./session');
    const token = await getStoredToken();
    if (!token) return null;
    const res = await fetch(`${SITE_URL}${path}`, {
      method: init.method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body ? JSON.stringify(init.body) : undefined,
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export type PhoneVerifyResult =
  | { success: true; phone: string; phoneVerificationToken: string; message: string }
  | { success: false; error: string };

export async function requestPhoneVerifyCode(
  phone: string,
): Promise<{ success: true; message: string } | { success: false; error: string }> {
  return (
    (await authedJson<{ success: true; message: string } | { success: false; error: string }>(
      '/api/auth/mobile/phone-verify',
      { method: 'POST', body: { method: 'whatsapp', phone } },
    )) ?? { success: false, error: 'Could not reach FinderB. Check your connection.' }
  );
}

export async function verifyPhoneCode(phone: string, code: string): Promise<PhoneVerifyResult> {
  return (
    (await authedJson<PhoneVerifyResult>('/api/auth/mobile/phone-verify', {
      method: 'POST',
      body: { method: 'whatsapp', phone, code },
    })) ?? { success: false, error: 'Could not reach FinderB. Check your connection.' }
  );
}

/** Opens Truecaller and waits for it to confirm the SIM number. Never throws. */
export async function verifyPhoneWithTruecaller(): Promise<PhoneVerifyResult> {
  if (Platform.OS !== 'android') {
    return { success: false, error: 'Truecaller verification works on Android with the Truecaller app.' };
  }
  const requestId = createRequestId();
  const start = await authedJson<{ success: boolean; deepLink?: string; error?: string }>(
    '/api/auth/mobile/phone-verify',
    { method: 'POST', body: { method: 'truecaller', requestId } },
  );
  if (!start?.success || !start.deepLink) {
    return { success: false, error: start?.error || 'Could not start Truecaller verification.' };
  }
  try {
    await Linking.openURL(start.deepLink);
  } catch {
    return { success: false, error: 'Install the Truecaller app to verify with Truecaller.' };
  }

  const started = Date.now();
  await sleep(1500);
  while (Date.now() - started < 120_000) {
    const status = await authedJson<{
      status?: string;
      phone?: string;
      phoneVerificationToken?: string;
      message?: string;
      error?: string;
    }>(`/api/auth/mobile/phone-verify?requestId=${encodeURIComponent(requestId)}`, { method: 'GET' });
    if (status?.status === 'completed' && status.phone && status.phoneVerificationToken) {
      return {
        success: true,
        phone: status.phone,
        phoneVerificationToken: status.phoneVerificationToken,
        message: status.message || 'Mobile number verified with Truecaller.',
      };
    }
    if (status?.status === 'error') {
      return { success: false, error: status.error || 'Truecaller verification did not finish.' };
    }
    await sleep(AppState.currentState === 'active' ? 1500 : 3000);
  }
  return { success: false, error: 'Truecaller verification timed out. Please try again.' };
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  return postJson('/api/auth/mobile/login', { email, password });
}

export type PasswordResetRequestResult =
  | {
      success: true;
      message: string;
      next: 'code' | 'oauth' | 'none';
      provider?: string;
    }
  | { success: false; error: string };

export async function requestPasswordReset(
  email: string,
): Promise<PasswordResetRequestResult> {
  return postJson('/api/auth/forgot-password', { email });
}

export async function resetPasswordWithCode(input: {
  email: string;
  code: string;
  password: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  return postJson('/api/auth/reset-password', input);
}

export async function registerWithPassword(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<AuthResult> {
  return postJson('/api/auth/mobile/register', input);
}

export async function fetchSessionUser(token: string): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/auth/mobile/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    });
    const data = (await res.json()) as { success?: boolean; user?: AuthUser };
    if (!data.success || !data.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

export async function requestUserEmailOtp(
  email: string,
): Promise<{ success: true; message: string } | AuthFailure> {
  return postJson('/api/auth/email-otp', { email: email.trim().toLowerCase() });
}

export async function verifyUserEmailOtp(
  email: string,
  code: string,
): Promise<
  | { success: true; emailVerificationToken: string; message: string }
  | AuthFailure
> {
  return postJson('/api/auth/email-otp', {
    email: email.trim().toLowerCase(),
    code,
  });
}

export async function updateMobileProfile(patch: {
  fullName?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string | null;
  emailVerificationToken?: string;
  phoneVerificationToken?: string;
}): Promise<AuthResult> {
  try {
    const { getStoredToken } = await import('./session');
    const token = await getStoredToken();
    if (!token) {
      return { success: false, error: 'Please log in.' };
    }
    const res = await fetch(`${SITE_URL}/api/auth/mobile/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(patch),
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as AuthResult;
    } catch {
      return {
        success: false,
        error:
          res.status === 404
            ? 'Profile update is not available on the server yet. Please try again after the next deploy.'
            : `Server error (${res.status}). Could not update profile.`,
      };
    }
  } catch (error) {
    return {
      success: false,
      error:
        safeUserError(error, 'Could not update profile.'),
    };
  }
}

export async function uploadMobileAvatar(image: string): Promise<AuthResult> {
  try {
    const { getStoredToken } = await import('./session');
    const token = await getStoredToken();
    if (!token) {
      return { success: false, error: 'Please log in.' };
    }
    const res = await fetch(`${SITE_URL}/api/auth/mobile/avatar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ image }),
    });
    const text = await res.text();
    try {
      return JSON.parse(text) as AuthResult;
    } catch {
      return { success: false, error: 'Could not upload the photo. Please try again.' };
    }
  } catch {
    return { success: false, error: 'Could not upload the photo. Check your internet and try again.' };
  }
}

/**
 * Prefer the app deep link so Google returns straight into FinderB
 * without an intermediate website page. HTTPS bridge remains a fallback
 * if the provider rejects the custom scheme.
 */
function googleAppRedirect(): string {
  return APP_CALLBACK;
}

function googleHttpsRedirect(): string {
  return `${SITE_URL}/auth/mobile-callback`;
}

function isGoogleCallbackUrl(url: string): boolean {
  return (
    url.startsWith(APP_CALLBACK) ||
    url.startsWith(APP_CALLBACK_ALT) ||
    url.includes('/auth/callback') ||
    url.includes('/auth/mobile-callback') ||
    url.includes('access_token=') ||
    /[?&#]code=/.test(url)
  );
}

async function exchangeGoogleUrlForAccessToken(url: string): Promise<AuthResult | string> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured in the app.' };
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    return {
      success: false,
      error:
        typeof errorCode === 'string'
          ? errorCode
          : 'Google sign-in failed. Please try again.',
    };
  }

  let accessToken = params.access_token || '';
  const refreshToken = params.refresh_token || '';

  if (accessToken && refreshToken) {
    const sessionResult = await withTimeout(
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }),
      STEP_TIMEOUT_MS,
    );
    if (sessionResult?.data.session?.access_token) {
      accessToken = sessionResult.data.session.access_token;
    }
  } else if (!accessToken && params.code) {
    const exchanged = await withTimeout(
      supabase.auth.exchangeCodeForSession(params.code),
      STEP_TIMEOUT_MS,
    );
    if (!exchanged || exchanged.error || !exchanged.data.session?.access_token) {
      const existing = await withTimeout(supabase.auth.getSession(), 5000);
      if (existing?.data.session?.access_token) {
        accessToken = existing.data.session.access_token;
      } else {
        const msg = !exchanged
          ? 'Google sign-in is taking too long. Check your internet and try again.'
          : exchanged.error?.message || 'Could not finish Google sign-in.';
        return {
          success: false,
          error: /code verifier|pkce|flow state/i.test(msg)
            ? 'Google sign-in took too long to come back. Please tap Continue with Google again.'
            : msg,
        };
      }
    } else {
      accessToken = exchanged.data.session.access_token;
    }
  }

  if (!accessToken) {
    const existing = await withTimeout(supabase.auth.getSession(), 5000);
    accessToken = existing?.data.session?.access_token || '';
  }

  if (!accessToken) {
    return {
      success: false,
      error:
        'Google did not return a session. Add https://finderb.com/auth/mobile-callback and finderb://auth/callback to Supabase Redirect URLs.',
    };
  }

  return accessToken;
}

/**
 * Android hands the Google redirect both to AuthSession and to the router (which opens
 * `/auth/callback`). The one-time code can only be exchanged once, so every receiver shares
 * this single completion per code.
 */
const googleCompletions = new Map<string, Promise<AuthResult>>();
let latestGoogleCompletion: Promise<AuthResult> | null = null;
let googleLoginActive = false;
/** Hands a completion started by the router to the login flow that is waiting on the browser. */
let notifyGoogleCompletion: ((task: Promise<AuthResult>) => void) | null = null;

/** True while the login screen's own Google flow is waiting on the browser. */
export function isGoogleLoginActive(): boolean {
  return googleLoginActive;
}

export function completeGoogleRedirect(url: string): Promise<AuthResult> {
  const { params } = QueryParams.getQueryParams(url);
  const key = params.code || params.access_token || url;
  const running = googleCompletions.get(key);
  if (running) return running;

  const task = (async (): Promise<AuthResult> => {
    const tokenOrError = await exchangeGoogleUrlForAccessToken(url);
    if (typeof tokenOrError !== 'string') return tokenOrError;
    const auth = await postJson<AuthResult>(
      '/api/auth/mobile/oauth',
      { accessToken: tokenOrError },
      SERVER_TIMEOUT_MS,
    );
    // Only the FinderB token is kept; the Supabase session is dropped in the background.
    if (supabase) void withTimeout(supabase.auth.signOut({ scope: 'local' }), 5000);
    return auth;
  })().catch(
    (error): AuthResult => ({
      success: false,
      error: safeUserError(error, 'Could not finish Google sign-in.'),
    }),
  );
  googleCompletions.set(key, task);
  latestGoogleCompletion = task;
  notifyGoogleCompletion?.(task);
  return task;
}

async function waitForGoogleCallback(authUrl: string): Promise<{ type: string; url?: string }> {
  let settled = false;
  let resolveLink: ((value: { type: string; url?: string }) => void) | null = null;

  const linkingPromise = new Promise<{ type: string; url?: string }>((resolve) => {
    resolveLink = resolve;
  });

  const sub = Linking.addEventListener('url', ({ url }) => {
    if (!settled && isGoogleCallbackUrl(url)) {
      settled = true;
      resolveLink?.({ type: 'success', url });
    }
  });

  try {
    // Wait on the app scheme — HTTPS alone never returns to Expo AuthSession on Android.
    const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, APP_CALLBACK, {
      showInRecents: true,
      preferEphemeralSession: false,
      createTask: false,
    });

    if (
      browserResult.type === 'success' &&
      browserResult.url &&
      isGoogleCallbackUrl(browserResult.url)
    ) {
      settled = true;
      return browserResult;
    }

    // Custom Tabs often dismiss after the finderb:// bounce — Linking may still win.
    const late = await Promise.race([
      linkingPromise,
      sleep(2800).then(() => null),
    ]);

    if (late?.type === 'success' && late.url) {
      return late;
    }

    return browserResult;
  } finally {
    sub.remove();
    if (settled) closeAuthBrowser();
  }
}

/** Android has no API to close a Custom Tab (the call throws); the app simply comes to front. */
function closeAuthBrowser() {
  if (Platform.OS === 'android') return;
  try {
    WebBrowser.dismissAuthSession();
  } catch {
    // Already closed.
  }
}

function failedResult(error: unknown, fallback: string): AuthResult {
  return { success: false, error: safeUserError(error, fallback) };
}

/** Never throws: a thrown error would leave the login button spinning. */
export async function loginWithGoogle(): Promise<AuthResult> {
  try {
    return await runGoogleLogin();
  } catch (error) {
    return failedResult(error, 'Could not finish Google sign-in. Please try again.');
  }
}

async function runGoogleLogin(): Promise<AuthResult> {
  if (!supabase) {
    return { success: false, error: 'Supabase is not configured in the app.' };
  }

  // Try native app scheme first (no intermediate website page).
  const redirectCandidates = [googleAppRedirect(), googleHttpsRedirect()];

  await withTimeout(WebBrowser.warmUpAsync(), 3000);
  googleLoginActive = true;
  latestGoogleCompletion = null;

  try {
    let authUrl: string | null = null;
    let lastError: string | null = null;

    for (const redirectTo of redirectCandidates) {
      if (__DEV__) {
        console.log('[auth] Google redirect try:', redirectTo);
      }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          queryParams: {
            access_type: 'online',
            prompt: 'select_account',
          },
        },
      });
      if (error || !data.url) {
        lastError = error?.message || 'Could not start Google sign-in.';
        continue;
      }
      authUrl = data.url;
      break;
    }

    if (!authUrl) {
      return {
        success: false,
        error: lastError || 'Could not start Google sign-in.',
      };
    }

    // Whichever receives Google's redirect first wins: AuthSession, or the router opening
    // `/auth/callback`. On some phones AuthSession never reports back at all.
    const viaRouter = new Promise<{ task: Promise<AuthResult> }>((resolve) => {
      notifyGoogleCompletion = (task) => resolve({ task });
    });
    const first = await Promise.race([
      waitForGoogleCallback(authUrl).then((result) => ({ kind: 'browser' as const, result })),
      viaRouter.then(({ task }) => ({ kind: 'router' as const, task })),
    ]);

    if (first.kind === 'router') {
      closeAuthBrowser();
      return await first.task;
    }
    if (first.result.type === 'success' && first.result.url) {
      return await completeGoogleRedirect(first.result.url);
    }
    const started = latestGoogleCompletion as Promise<AuthResult> | null;
    if (started) return await started;
    // The browser closed; give a late deep link a moment before calling it cancelled.
    const late = await Promise.race([viaRouter, sleep(3000).then(() => null)]);
    if (late) return await late.task;
    return { success: false, error: 'Google sign-in was cancelled.' };
  } finally {
    googleLoginActive = false;
    notifyGoogleCompletion = null;
    void withTimeout(WebBrowser.coolDownAsync(), 3000);
  }
}

function createRequestId(): string {
  const bytes = new Uint8Array(24);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Same deep-link shape as the website — partner key is NEXT_PUBLIC / EXPO_PUBLIC. */
function buildTruecallerDeepLink(requestId: string): string | null {
  const partnerKey = process.env.EXPO_PUBLIC_TRUECALLER_PARTNER_KEY?.trim();
  if (!partnerKey) return null;

  const partnerName =
    process.env.EXPO_PUBLIC_TRUECALLER_PARTNER_NAME?.trim() || 'FinderB';
  const origin = SITE_URL.replace(/\/$/, '');

  const params = new URLSearchParams({
    type: 'btmsheet',
    requestNonce: requestId,
    partnerKey,
    partnerName,
    lang: 'en',
    privacyUrl: `${origin}/privacy`,
    termsUrl: `${origin}/terms`,
    loginPrefix: 'continue',
    loginSuffix: 'login',
    ctaPrefix: 'continuewith',
    ctaColor: '%230087FF',
    ctaTextColor: '%23ffffff',
    btnShape: 'round',
    ttl: '600000',
  });

  return `truecallersdk://truesdk/web_verify?${params.toString()}`;
}

async function pollTruecallerStatus(requestId: string): Promise<AuthResult> {
  const started = Date.now();
  const maxMs = 120_000;

  const checkOnce = async (): Promise<AuthResult | 'pending'> => {
    try {
      const res = await fetch(
        `${SITE_URL}/api/auth/truecaller/status?requestId=${encodeURIComponent(
          requestId,
        )}&client=mobile`,
        { headers: { Accept: 'application/json' } },
      );
      // Busy or rate-limited server: keep waiting rather than failing the sign-in.
      if (res.status === 429 || res.status >= 500) return 'pending';
      const data = (await res.json()) as {
        status?: string;
        token?: string;
        user?: AuthUser;
        error?: string;
        isNewUser?: boolean;
      };

      if (data.status === 'completed' && data.token && data.user) {
        return {
          success: true,
          token: data.token,
          user: data.user,
          isNewUser: data.isNewUser,
        };
      }
      if (data.status === 'user_rejected') {
        return {
          success: false,
          error: data.error || 'You declined Truecaller verification.',
        };
      }
      if (data.status === 'error') {
        return {
          success: false,
          error: data.error || 'Truecaller verification failed.',
        };
      }
      return 'pending';
    } catch {
      return 'pending';
    }
  };

  if (AppState.currentState !== 'active') {
    await new Promise<void>((resolve) => {
      const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
        if (next === 'active') {
          sub.remove();
          resolve();
        }
      });
      setTimeout(() => {
        sub.remove();
        resolve();
      }, 2500);
    });
  } else {
    await sleep(1200);
  }

  while (Date.now() - started < maxMs) {
    const result = await checkOnce();
    if (result !== 'pending') return result;
    const delay = AppState.currentState === 'active' ? 1500 : 3000;
    await sleep(delay);
  }

  return { success: false, error: 'Verification timed out. Please try again.' };
}

/** Never throws: a thrown error would leave the login button spinning. */
export async function loginWithTruecaller(): Promise<AuthResult> {
  try {
    return await runTruecallerLogin();
  } catch (error) {
    return failedResult(error, 'Could not finish Truecaller sign-in. Please try again.');
  }
}

async function runTruecallerLogin(): Promise<AuthResult> {
  if (Platform.OS !== 'android') {
    return {
      success: false,
      error:
        'Truecaller one-tap works on Android with the Truecaller app installed.',
    };
  }

  const enabled = process.env.EXPO_PUBLIC_TRUECALLER_ENABLED === 'true';
  const deepLinkFromEnv = (requestId: string) => buildTruecallerDeepLink(requestId);

  if (!enabled && !process.env.EXPO_PUBLIC_TRUECALLER_PARTNER_KEY?.trim()) {
    return {
      success: false,
      error:
        'Truecaller sign-in is unavailable right now.',
    };
  }

  const requestId = createRequestId();

  const init = await postJson<{
    ok?: boolean;
    deepLink?: string;
    error?: string;
    success?: boolean;
  }>('/api/auth/truecaller/init', {
    requestId,
    redirectPath: '/dashboard',
  });

  if (init.error && !init.ok) {
    return {
      success: false,
      error:
        init.error ||
        'Truecaller is not available on the FinderB server.',
    };
  }

  const deepLink = init.deepLink || deepLinkFromEnv(requestId);
  if (!deepLink) {
    return {
      success: false,
      error:
        'Truecaller sign-in is unavailable right now.',
    };
  }

  try {
    await Linking.openURL(deepLink);
  } catch {
    return {
      success: false,
      error: 'Install the Truecaller app to continue with Truecaller.',
    };
  }

  return pollTruecallerStatus(requestId);
}
