import { describe, it, expect } from 'vitest';
import {
  ApiErrorSchema,
  ValidationErrorSchema,
  ErrorCodes
} from './errors';

describe('ApiErrorSchema', () => {
  it('should accept valid API error', () => {
    const error = {
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found'
      }
    };
    expect(ApiErrorSchema.parse(error)).toEqual(error);
  });

  it('should accept error with details', () => {
    const error = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          field: 'title',
          reason: 'too long'
        }
      }
    };
    expect(ApiErrorSchema.parse(error)).toEqual(error);
  });
});

describe('ValidationErrorSchema', () => {
  it('should accept valid validation error', () => {
    const error = {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          issues: [
            { path: ['title'], message: 'Required' },
            { path: ['price'], message: 'Must be positive' }
          ]
        }
      }
    };
    expect(ValidationErrorSchema.parse(error)).toEqual(error);
  });
});

describe('ErrorCodes', () => {
  it('should have all expected error codes', () => {
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND');
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED');
    expect(ErrorCodes.RATE_LIMITED).toBe('RATE_LIMITED');
    expect(ErrorCodes.FILE_TOO_LARGE).toBe('FILE_TOO_LARGE');
    expect(ErrorCodes.INVALID_FILE_TYPE).toBe('INVALID_FILE_TYPE');
    expect(ErrorCodes.AI_SERVICE_ERROR).toBe('AI_SERVICE_ERROR');
    expect(ErrorCodes.PRICING_SERVICE_ERROR).toBe('PRICING_SERVICE_ERROR');
    expect(ErrorCodes.INTERNAL_ERROR).toBe('INTERNAL_ERROR');
    expect(ErrorCodes.SCAN_NOT_READY).toBe('SCAN_NOT_READY');
  });

  it('should be immutable', () => {
    // @ts-expect-error - Testing runtime immutability
    expect(() => { ErrorCodes.NOT_FOUND = 'CHANGED'; }).toThrow();
  });
});
