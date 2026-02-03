import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ErrorCodes } from '@i2k/shared';

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  request.log.error(error);

  // Zod validation errors
  if (error instanceof ZodError) {
    const response: ApiErrorResponse = {
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: {
          issues: error.errors.map(e => ({
            path: e.path.map(String),
            message: e.message
          }))
        }
      }
    };
    reply.status(400).send(response);
    return;
  }

  // Custom app errors
  if (error instanceof AppError) {
    const response: ApiErrorResponse = {
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      }
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Fastify errors (rate limit, etc.)
  if ('statusCode' in error && typeof error.statusCode === 'number') {
    const response: ApiErrorResponse = {
      error: {
        code: error.code || ErrorCodes.INTERNAL_ERROR,
        message: error.message
      }
    };
    reply.status(error.statusCode).send(response);
    return;
  }

  // Unknown errors
  const response: ApiErrorResponse = {
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : error.message
    }
  };
  reply.status(500).send(response);
}
