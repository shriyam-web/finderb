import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['query'],
    adapter: new PrismaPg(new Pool({ 
      connectionString: process.env.DB_URL || process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    })),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
