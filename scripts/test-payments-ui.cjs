/**
 * Payment/admin route smoke tests.
 */
const { chromium } = require('playwright');

const TARGET = process.env.TEST_URL || 'http://localhost:3000';
const results = [];

function pass(n, d = '') {
  results.push(true);
  console.log(`PASS ${n}${d ? ` — ${d}` : ''}`);
}
function fail(n, d = '') {
  results.push(false);
  console.error(`FAIL ${n}${d ? ` — ${d}` : ''}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Admin payments requires auth
    await page.goto(`${TARGET}/admin/payments`, { waitUntil: 'networkidle' });
    if (page.url().includes('/admin/login')) pass('Admin payments redirects unauthenticated users to login');
    else fail('Admin payments redirects unauthenticated users', page.url());

    // Admin login page
    await page.goto(`${TARGET}/admin/login`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Admin sign in', { timeout: 30000 });
    const hasForm = (await page.locator('input[type="password"], input[type="email"]').count()) >= 2;
    if (hasForm) pass('Admin login page renders form');
    else fail('Admin login page renders form');

    // Pricing page (merchant plans)
    await page.goto(`${TARGET}/pricing`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1, h2', { timeout: 30000 });
    const pricingText = await page.locator('body').innerText();
    if (/pricing|plan|month|annual|business|pro/i.test(pricingText)) pass('Pricing page shows plan content');
    else fail('Pricing page shows plan content', pricingText.slice(0, 200));

    // Footer Get Started (homepage splash hides after ~3s)
    await page.goto(`${TARGET}/`, { waitUntil: 'domcontentloaded' });
    const getStarted = page.getByRole('link', { name: 'Get Started' });
    await getStarted.waitFor({ state: 'visible', timeout: 15000 });
    pass('Footer shows Get Started CTA');
  } catch (e) {
    fail('Unexpected', e.message);
  } finally {
    await browser.close();
  }

  const ok = results.filter(Boolean).length;
  console.log(`\n${ok}/${results.length} passed`);
  if (ok !== results.length) process.exit(1);
})();
