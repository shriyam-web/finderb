import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.DIRECT_URL ||
  process.env.DB_URL;

if (!databaseUrl) {
  const message =
    'DATABASE_URL is not available at runtime. Please add DATABASE_URL to your Vercel runtime environment variables.';
  console.error('❌', message);
  throw new Error(message);
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

process.env.DATABASE_URL = databaseUrl;

const prismaConfig: ConstructorParameters<typeof PrismaClient>[0] = {
  adapter: new PrismaPg(databaseUrl),
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
