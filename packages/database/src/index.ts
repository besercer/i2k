import { PrismaClient } from '@prisma/client';

// Global prisma instance to prevent multiple connections in development
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Re-export all Prisma types
export * from '@prisma/client';

// Helper to disconnect (for tests)
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

// Helper to connect (for health checks)
export async function connectDatabase(): Promise<void> {
  await prisma.$connect();
}
