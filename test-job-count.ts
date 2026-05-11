import { config } from "dotenv";
config({ override: true });

import { prisma } from './lib/prisma';

async function main() {
  try {
    console.log('Testing job.count()...');
    const count = await prisma.job.count();
    console.log('Job count:', count);
  } catch (error: any) {
    console.error('Job count failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
