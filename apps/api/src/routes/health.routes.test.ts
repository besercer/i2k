import { describe, it, expect, vi, beforeEach } from 'vitest';
import Fastify from 'fastify';
import { healthRoutes } from './health.routes';
import { prisma } from '@i2k/database';

describe('Health Routes', () => {
  let app: ReturnType<typeof Fastify>;

  beforeEach(async () => {
    app = Fastify();
    await app.register(healthRoutes, { prefix: '/v1' });
    await app.ready();
  });

  describe('GET /v1/health', () => {
    it('should return ok status when database is healthy', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/health'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.services.database).toBe('ok');
    });

    it('should return degraded status when database fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB Error'));

      const response = await app.inject({
        method: 'GET',
        url: '/v1/health'
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('degraded');
      expect(body.services.database).toBe('error');
    });

    it('should include timestamp', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/health'
      });

      const body = JSON.parse(response.body);
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('GET /v1/health/ready', () => {
    it('should return ready true when database is connected', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([{ 1: 1 }]);

      const response = await app.inject({
        method: 'GET',
        url: '/v1/health/ready'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.ready).toBe(true);
    });

    it('should return ready false when database fails', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('DB Error'));

      const response = await app.inject({
        method: 'GET',
        url: '/v1/health/ready'
      });

      expect(response.statusCode).toBe(503);
      const body = JSON.parse(response.body);
      expect(body.ready).toBe(false);
    });
  });

  describe('GET /v1/health/live', () => {
    it('should always return alive true', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/v1/health/live'
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.alive).toBe(true);
    });
  });
});
