import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from './config/env';
import { errorHandler } from './plugins/error-handler';
import { scanRoutes } from './routes/scan.routes';
import { healthRoutes } from './routes/health.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      transport: env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined
    },
    trustProxy: true
  });

  // Security plugins
  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production'
  });

  await app.register(cors, {
    origin: env.CORS_ORIGIN.split(','),
    credentials: true
  });

  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS
  });

  // Utilities
  await app.register(sensible);

  // Multipart for file uploads
  await app.register(multipart, {
    limits: {
      fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
      files: 1
    }
  });

  // Swagger documentation
  if (env.ENABLE_SWAGGER) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'i2k API',
          description: 'Board game recognition and listing generation API',
          version: '1.0.0'
        },
        servers: [
          { url: `http://localhost:${env.PORT}`, description: 'Development' }
        ],
        tags: [
          { name: 'scans', description: 'Scan operations' },
          { name: 'health', description: 'Health checks' }
        ]
      }
    });

    await app.register(swaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true
      }
    });
  }

  // Custom error handler
  app.setErrorHandler(errorHandler);

  // Routes
  await app.register(healthRoutes, { prefix: '/v1' });
  await app.register(scanRoutes, { prefix: '/v1/scans' });

  return app;
}
