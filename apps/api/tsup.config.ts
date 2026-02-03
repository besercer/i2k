import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  target: 'node20',
  platform: 'node',
  splitting: false,
  treeshake: true,
  external: [
    '@i2k/database',
    '@i2k/shared',
    '@i2k/ai-client',
    '@fastify/cors',
    '@fastify/helmet',
    '@fastify/multipart',
    '@fastify/rate-limit',
    '@fastify/sensible',
    '@fastify/swagger',
    '@fastify/swagger-ui',
    'fastify',
    'bullmq',
    'ioredis',
    'sharp',
    'zod',
    'nanoid',
    'dotenv'
  ]
});
