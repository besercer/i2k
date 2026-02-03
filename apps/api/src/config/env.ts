import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url(),

  // AI Provider
  OPENAI_API_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(['openai', 'mock']).default('openai'),
  AI_MODEL: z.string().default('gpt-4o'),

  // Security
  CORS_ORIGIN: z.string().default('http://localhost:3001'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),

  // Upload
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('12'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Features
  ENABLE_SWAGGER: z.string().transform(v => v === 'true').default('true')
});

function validateEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }

  return parsed.data;
}

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
