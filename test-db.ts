import { config } from "dotenv";
config({ override: true });

import { prisma } from './lib/prisma';

async function main() {
  try {
    console.log('Attempting to connect to database...');
    console.log('DB_URL from process.env:', process.env.DB_URL);
    console.log('DATABASE_URL from process.env:', process.env.DATABASE_URL);
    console.log('DIRECT_URL from process.env:', process.env.DIRECT_URL);
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('Connection successful:', result);
  } catch (error: any) {
    console.error('Connection failed:', error.message || error);
    if (error.code) {
      console.error('Prisma Error Code:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
