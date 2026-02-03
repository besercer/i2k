import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { prisma } from '@i2k/database';

interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  services: {
    database: 'ok' | 'error';
    redis?: 'ok' | 'error';
  };
}

export const healthRoutes: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get('/health', {
    schema: {
      tags: ['health'],
      summary: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
            timestamp: { type: 'string' },
            services: {
              type: 'object',
              properties: {
                database: { type: 'string', enum: ['ok', 'error'] },
                redis: { type: 'string', enum: ['ok', 'error'] }
              }
            }
          }
        }
      }
    }
  }, async (_request, reply) => {
    const response: HealthResponse = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'ok'
      }
    };

    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      response.services.database = 'error';
      response.status = 'degraded';
    }

    const statusCode = response.status === 'ok' ? 200 : 503;
    return reply.status(statusCode).send(response);
  });

  app.get('/health/ready', {
    schema: {
      tags: ['health'],
      summary: 'Readiness probe'
    }
  }, async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return reply.status(200).send({ ready: true });
    } catch {
      return reply.status(503).send({ ready: false });
    }
  });

  app.get('/health/live', {
    schema: {
      tags: ['health'],
      summary: 'Liveness probe'
    }
  }, async (_request, reply) => {
    return reply.status(200).send({ alive: true });
  });
};
