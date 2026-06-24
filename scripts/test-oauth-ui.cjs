/**
 * OAuth UI smoke tests. Run via Playwright skill:
 *   cd path/to/playwright-skill && node run.js "path/to/test-oauth-ui.cjs"
 */
const { chromium } = require('playwright');

const TARGET_URL = process.env.TEST_URL || 'http://localhost:3000';
const results = [];

function pass(name, detail = '') {
  results.push({ name, ok: true, detail });
  console.log(`PASS ${name}${detail ? ` — ${detail}` : ''}`);
}

function fail(name, detail = '') {
  results.push({ name, ok: false, detail });
  console.error(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
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
  if (await btn.isVisible()) pass('Login page shows Google button');
  else fail('Login page shows Google button', 'button not visible');
}

async function testSignupGoogleButton(page) {
  await page.goto(`${TARGET_URL}/signup`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('button:has-text("Sign up with Google")', { timeout: 30000 });
  const btn = page.getByRole('button', { name: /Sign up with Google/i });
  if (await btn.isVisible()) pass('Signup page shows Google button');
  else fail('Signup page shows Google button', 'button not visible');
}

async function testOAuthRedirectStarts(page) {
  await waitForAuthShell(page);
  const btn = page.getByRole('button', { name: /Continue with Google/i });

  const navigation = page.waitForURL(/supabase\.co|accounts\.google\.com|auth\/v1\/authorize/, {
    timeout: 20000,
  });

  await btn.click();
  try {
    await navigation;
    pass('Google click starts OAuth redirect', page.url().slice(0, 120));
  } catch {
    fail('Google click starts OAuth redirect', `landed on: ${page.url()}`);
  }
}

async function testCallbackMissingCode(page) {
  await page.goto(`${TARGET_URL}/auth/callback`, { waitUntil: 'networkidle' });
  if (page.url().includes('error=missing_oauth_code')) {
    pass('Callback without code redirects with missing_oauth_code');
  } else {
    fail('Callback without code redirects with missing_oauth_code', page.url());
  }
}

async function testLoginShowsOAuthError(page) {
  await page.goto(`${TARGET_URL}/login?error=missing_oauth_code`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForSelector('button:has-text("Continue with Google")', { timeout: 30000 });
  pass('Login page loads with error query param');
}

async function testOnlyGoogleEnabled(page) {
  await waitForAuthShell(page);
  const apple = await page.getByRole('button', { name: /Apple/i }).count();
  const github = await page.getByRole('button', { name: /GitHub/i }).count();
  if (apple === 0 && github === 0) pass('Only configured providers shown (google only)');
  else fail('Only configured providers shown', `apple=${apple}, github=${github}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

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
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
})();
