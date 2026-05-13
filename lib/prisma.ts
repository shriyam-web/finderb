import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ override: true });
}

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.DB_URL;

console.log('🔍 Database URL being used (obfuscated):', databaseUrl?.replace(/:[^:@]+@/, ':***@'));
console.log('🔍 Using DIRECT_URL if available:', !!process.env.DIRECT_URL);


if (!databaseUrl) {
  const message =
    'DATABASE_URL is not available at runtime. Please add DATABASE_URL to your Vercel runtime environment variables.';
  console.error('❌', message);
  throw new Error(message);
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

process.env.DATABASE_URL = databaseUrl;

try {
  const parsedUrl = new URL(databaseUrl);
  console.log(
    `✓ Prisma runtime DB target: host=${parsedUrl.hostname} port=${parsedUrl.port || '5432'} protocol=${parsedUrl.protocol} sslmode=${parsedUrl.searchParams.get('sslmode') || 'default'}`
  );
  if (parsedUrl.port === '5432' && !process.env.ALLOW_DIRECT_DB) {
    console.warn('⚠️ Warning: Using direct connection (5432). If this is a serverless environment, this might fail. Consider using pooled connection (6543).');
  }
} catch (parseError) {
  console.warn('⚠️ Unable to parse DATABASE_URL for runtime logging');
}

const pool = new Pool({ 
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: databaseUrl?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined
});

const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  adapter: new PrismaPg(pool),
  log: ['query', 'error'] as Array<'query' | 'error'>,
  errorFormat: 'pretty',
};

let prisma: PrismaClient;

try {
  prisma = globalForPrisma.prisma || new PrismaClient(prismaConfig);
  console.log('✓ Prisma Client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  throw new Error(
    'Database connection failed during Prisma Client initialization. Check your Vercel runtime DATABASE_URL setting.'
  );
}

export { prisma };

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
