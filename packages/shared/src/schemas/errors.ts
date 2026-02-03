import { z } from 'zod';

export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional()
  })
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const ValidationErrorSchema = z.object({
  error: z.object({
    code: z.literal('VALIDATION_ERROR'),
    message: z.string(),
    details: z.object({
      issues: z.array(z.object({
        path: z.array(z.string()),
        message: z.string()
      }))
    })
  })
});
export type ValidationError = z.infer<typeof ValidationErrorSchema>;

// Error codes
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  PRICING_SERVICE_ERROR: 'PRICING_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SCAN_NOT_READY: 'SCAN_NOT_READY'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
