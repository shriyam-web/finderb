import { PrismaClient } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL and DIRECT_URL are not set!');
  console.error('Please add DATABASE_URL to your Vercel environment variables.');
}

process.env.DATABASE_URL = databaseUrl;
const globalForPrisma = global as unknown as { prisma: PrismaClient };

let prisma: PrismaClient;

try {
  prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: ['query', 'error'],
      errorFormat: 'pretty',
    });

  console.log('✓ Prisma Client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  throw new Error('Database connection failed. Please check your environment variables.');
}

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
