const fs = require('fs');
const paths = ['../.env.local', '../.env'];
let url = '';
let key = '';
let site = 'https://finderb.com';

for (const p of paths) {
  try {
    const t = fs.readFileSync(p, 'utf8');
    url = url || (t.match(/^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m) || [])[1]?.trim();
    key = key || (t.match(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=(.+)$/m) || [])[1]?.trim();
    site = (t.match(/^NEXT_PUBLIC_SITE_URL=(.+)$/m) || [])[1]?.trim() || site;
  } catch {
    // ignore missing files
  }
}

if (!url || !key) {
  console.error('FAIL: missing Supabase public env');
  process.exit(1);
}

const out = [
  `EXPO_PUBLIC_SUPABASE_URL=${url}`,
  `EXPO_PUBLIC_SUPABASE_ANON_KEY=${key}`,
  `EXPO_PUBLIC_SITE_URL=${site}`,
  '',
].join('\n');

fs.writeFileSync('.env', out);
fs.writeFileSync(
  '.env.example',
  [
    'EXPO_PUBLIC_SUPABASE_URL=',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=',
    'EXPO_PUBLIC_SITE_URL=https://finderb.com',
    '',
  ].join('\n'),
);

console.log('WROTE_ENV', url);
