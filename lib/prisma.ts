import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

// Store the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;

// Set the DATABASE_URL for Prisma to use
process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
