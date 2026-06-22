import { readFileSync } from 'fs';
import { Client } from 'pg';

function loadEnv() {
  for (const file of ['.env', '.env.local']) {
    try {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
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
    } catch {
      // ignore missing file
    }
  }
}

loadEnv();

const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Missing DIRECT_URL or DATABASE_URL');
  process.exit(1);
}

const sql = readFileSync('supabase/tourist_place_slugs.sql', 'utf8');
const client = new Client({ connectionString });

await client.connect();
await client.query(sql);
await client.end();
console.log('Applied supabase/tourist_place_slugs.sql');
