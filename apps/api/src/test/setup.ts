import { vi, beforeAll, afterAll, afterEach } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.HOST = '0.0.0.0';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.OPENAI_API_KEY = 'test-key';
process.env.AI_PROVIDER = 'mock';
process.env.AI_MODEL = 'gpt-4o';
process.env.CORS_ORIGIN = 'http://localhost:3001';
process.env.RATE_LIMIT_MAX = '100';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.MAX_FILE_SIZE_MB = '12';
process.env.UPLOAD_DIR = './test-uploads';
process.env.ENABLE_SWAGGER = 'false';

// Mock Prisma
vi.mock('@i2k/database', () => {
  const mockPrisma = {
    scan: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    priceSample: {
      create: vi.fn()
    },
    listingDraft: {
      findUnique: vi.fn(),
      upsert: vi.fn()
    },
    $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
    $connect: vi.fn(),
    $disconnect: vi.fn()
  };

  return {
    prisma: mockPrisma,
    connectDatabase: vi.fn(),
    disconnectDatabase: vi.fn()
  };
});

// Cleanup
afterEach(() => {
  vi.clearAllMocks();
});
