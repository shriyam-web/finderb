import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

// Store the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

// Log the database connection status for debugging
if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is NOT set!');
  console.error('Please add DATABASE_URL to your Vercel environment variables.');
} else {
  console.log('✓ DATABASE_URL is configured');
}

// Set the DATABASE_URL for Prisma to use
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
