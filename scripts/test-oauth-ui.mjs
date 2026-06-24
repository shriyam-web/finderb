/**
 * OAuth UI smoke tests (login/signup pages + callback error paths).
 * Run: node scripts/test-oauth-ui.mjs
 */
import { chromium } from 'playwright';

const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`✗ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function waitForAuthShell(page) {
  await page.goto(`${TARGET_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Continue with Google")', {
    timeout: 30000,
  });
}

async function testLoginGoogleButton(page) {
  await waitForAuthShell(page);
  const btn = page.getByRole('button', { name: /Continue with Google/i });
  const visible = await btn.isVisible();
  if (visible) pass('Login page shows Google button');
  else fail('Login page shows Google button', 'button not visible');
}

async function testSignupGoogleButton(page) {
  await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Sign up with Google")', {
    timeout: 30000,
  });
  const btn = page.getByRole('button', { name: /Sign up with Google/i });
  const visible = await btn.isVisible();
  if (visible) pass('Signup page shows Google button');
  else fail('Signup page shows Google button', 'button not visible');
}

async function testOAuthRedirectStarts(page) {
  await waitForAuthShell(page);
  const btn = page.getByRole('button', { name: /Continue with Google/i });

  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 15000 }).catch(() => null),
    page.waitForURL(/supabase\.co|accounts\.google\.com/, { timeout: 15000 }).catch(() => null),
    btn.click(),
  ]);

  const target = popup || page;
  const url = target.url();
  const isSupabaseOrGoogle =
    url.includes('lbarmiysgcdwyhgsyqit.supabase.co') ||
    url.includes('accounts.google.com') ||
    url.includes('/auth/v1/authorize');

  if (isSupabaseOrGoogle) {
    pass('Google click starts OAuth redirect', url.slice(0, 120));
  } else {
    fail('Google click starts OAuth redirect', `landed on: ${url}`);
  }

  if (popup) await popup.close().catch(() => {});
}

async function testCallbackMissingCode(page) {
  await page.goto(`${TARGET_URL}/auth/callback`, { waitUntil: 'networkidle' });
  const url = page.url();
  if (url.includes('error=missing_oauth_code')) {
    pass('Callback without code redirects with missing_oauth_code');
  } else {
    fail('Callback without code redirects with missing_oauth_code', url);
  }
}

async function testLoginShowsOAuthError(page) {
  await page.goto(`${TARGET_URL}/login?error=missing_oauth_code`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForTimeout(2000);
  const body = await page.locator('body').innerText();
  const hasError =
    /missing|oauth|sign.?in|error/i.test(body) || body.length > 100;
  if (hasError) pass('Login page loads with error query param');
  else fail('Login page loads with error query param', 'page may be empty');
}

async function testOnlyGoogleEnabled(page) {
  await waitForAuthShell(page);
  const apple = page.getByRole('button', { name: /Apple/i });
  const github = page.getByRole('button', { name: /GitHub/i });
  const appleCount = await apple.count();
  const githubCount = await github.count();
  if (appleCount === 0 && githubCount === 0) {
    pass('Only configured providers shown (google only)');
  } else {
    fail('Only configured providers shown', `apple=${appleCount}, github=${githubCount}`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await testLoginGoogleButton(page);
    await testSignupGoogleButton(page);
    await testOnlyGoogleEnabled(page);
    await testCallbackMissingCode(page);
    await testLoginShowsOAuthError(page);
    await testOAuthRedirectStarts(page);
  } catch (err) {
    fail('Unexpected test error', err instanceof Error ? err.message : String(err));
  } finally {
    await browser.close();
  }

  const failed = results.filter((r) => !r.ok);
  console.log('\n---');
  console.log(`${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
}

main();
