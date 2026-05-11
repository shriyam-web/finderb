const { prisma } = require('./lib/prisma');

async function test() {
  try {
    const count = await prisma.job.count();
    console.log('Successfully connected! Job count:', count);
  } catch (err) {
    console.error('Connection failed in test script:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

test();
