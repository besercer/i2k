import { describe, it, expect, vi } from 'vitest';
import { ZodError, z } from 'zod';
import { errorHandler, AppError } from './error-handler';
import { ErrorCodes } from '@i2k/shared';

describe('errorHandler', () => {
  const mockRequest = {
    log: {
      error: vi.fn()
    }
  } as any;

  const createMockReply = () => ({
    status: vi.fn().mockReturnThis(),
    send: vi.fn()
  });

  it('should handle ZodError', () => {
    const reply = createMockReply();
    const schema = z.object({ name: z.string() });

    let zodError: ZodError;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodError = e as ZodError;
    }

    errorHandler(zodError!, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: ErrorCodes.VALIDATION_ERROR,
          message: 'Validation failed'
        })
      })
    );
  });

  it('should handle AppError', () => {
    const reply = createMockReply();
    const error = new AppError(ErrorCodes.NOT_FOUND, 'Resource not found', 404);

    errorHandler(error, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(404);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: ErrorCodes.NOT_FOUND,
        message: 'Resource not found',
        details: undefined
      }
    });
  });

  it('should handle AppError with details', () => {
    const reply = createMockReply();
    const error = new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Invalid input',
      400,
      { field: 'email' }
    );

    errorHandler(error, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Invalid input',
        details: { field: 'email' }
      }
    });
  });

  it('should handle Fastify errors with statusCode', () => {
    const reply = createMockReply();
    const error = {
      statusCode: 429,
      code: ErrorCodes.RATE_LIMITED,
      message: 'Too many requests'
    } as any;

    errorHandler(error, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(429);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: ErrorCodes.RATE_LIMITED,
        message: 'Too many requests'
      }
    });
  });

  it('should handle unknown errors in production', () => {
    const reply = createMockReply();
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const error = new Error('Secret database error');

    errorHandler(error, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'An unexpected error occurred'
      }
    });

    process.env.NODE_ENV = originalEnv;
  });

  it('should show error message in non-production', () => {
    const reply = createMockReply();
    process.env.NODE_ENV = 'development';

    const error = new Error('Detailed error message');

    errorHandler(error, mockRequest, reply as any);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith({
      error: {
        code: ErrorCodes.INTERNAL_ERROR,
        message: 'Detailed error message'
      }
    });
  });
});

describe('AppError', () => {
  it('should create error with default status code', () => {
    const error = new AppError('TEST', 'Test message');
    expect(error.code).toBe('TEST');
    expect(error.message).toBe('Test message');
    expect(error.statusCode).toBe(500);
  });

  it('should create error with custom status code', () => {
    const error = new AppError('NOT_FOUND', 'Not found', 404);
    expect(error.statusCode).toBe(404);
  });

  it('should include details', () => {
    const error = new AppError('ERR', 'Error', 400, { foo: 'bar' });
    expect(error.details).toEqual({ foo: 'bar' });
  });

  it('should be instanceof Error', () => {
    const error = new AppError('TEST', 'Test');
    expect(error).toBeInstanceOf(Error);
  });
});
