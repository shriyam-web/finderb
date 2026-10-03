import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

function loadEnvFiles() {
  for (const file of ['.env', '.env.local']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

loadEnvFiles();

const messages = [
  {
    title: '🍕 12 baje craving? Classic.',
    message:
      'Ghar pe baith ke “paas mein kya milega” soch rahe ho? FinderB kholo — Google uncle ko raat ke 12 baje mat disturb karo 😂📍',
  },
  {
    title: '🔖 Favourite maar diya? Legend.',
    message:
      'Kal phir wahi shop dhundhne mat baithna. Ek tap favourite — future-you bolega “bhai tune toh soch ke rakha tha” 🙌✨',
  },
];

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const site = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_FINDERB_SITE_URL ||
  'https://finderb.com'
).replace(/\/$/, '');
const secret = process.env.FINDERB_DISPATCH_SECRET?.trim();

if (!url || !key) {
  console.error('Missing Supabase URL or key');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const gapMs = 60_000;

function sleep(ms) {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

async function dispatch(broadcastId) {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (secret) headers['x-finderb-dispatch'] = secret;
  const res = await fetch(`${site}/api/notifications/dispatch`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ broadcastId }),
  });
  return res.json().catch(() => ({ success: false, error: `HTTP ${res.status}` }));
}

for (let i = 0; i < messages.length; i += 1) {
  const item = messages[i];
  const { data, error } = await supabase
    .from('broadcasts')
    .insert({
      title: item.title,
      message: item.message,
      target_audience: ['Users'],
      show_datetime: true,
    })
    .select('id, created_at')
    .single();

  if (error || !data) {
    console.error(`Insert failed (${i + 1}/${messages.length}):`, error?.message || 'no row');
    process.exit(1);
  }

  const pushed = await dispatch(data.id);
  console.log(
    `${i + 1}/${messages.length} saved ${data.id} | push: ${pushed.success ? `sent ${pushed.sent ?? 0}` : pushed.error || 'failed'}`,
  );

  if (i < messages.length - 1) {
    console.log('Waiting 60s…');
    await sleep(gapMs);
  }
}

console.log('Done.');
