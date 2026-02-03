import { z } from 'zod';

// Scan Status Enum
export const ScanStatusSchema = z.enum([
  'UPLOADED',
  'ANALYZING',
  'ANALYZED',
  'PRICING',
  'PRICED',
  'DRAFTING',
  'DRAFTED',
  'ERROR'
]);
export type ScanStatus = z.infer<typeof ScanStatusSchema>;

// Game Condition Enum
export const GameConditionSchema = z.enum([
  'NEW',
  'LIKE_NEW',
  'VERY_GOOD',
  'GOOD',
  'ACCEPTABLE'
]);
export type GameCondition = z.infer<typeof GameConditionSchema>;

// Game Language
export const GameLanguageSchema = z.enum(['DE', 'EN', 'FR', 'ES', 'IT', 'NL', 'OTHER']);
export type GameLanguage = z.infer<typeof GameLanguageSchema>;

// AI Recognition Result
export const AiCandidateSchema = z.object({
  title: z.string().min(1),
  edition: z.string().optional(),
  languageGuess: GameLanguageSchema.optional(),
  confidence: z.number().int().min(0).max(100)
});
export type AiCandidate = z.infer<typeof AiCandidateSchema>;

export const AiEvidenceSchema = z.object({
  visibleText: z.array(z.string()),
  visualCues: z.array(z.string())
});
export type AiEvidence = z.infer<typeof AiEvidenceSchema>;

export const AiRecognitionResultSchema = z.object({
  best: AiCandidateSchema,
  alternatives: z.array(AiCandidateSchema),
  evidence: AiEvidenceSchema,
  needsConfirmation: z.boolean()
});
export type AiRecognitionResult = z.infer<typeof AiRecognitionResultSchema>;

// Create Scan Request
export const CreateScanRequestSchema = z.object({
  // File will be handled separately via multipart
});
export type CreateScanRequest = z.infer<typeof CreateScanRequestSchema>;

// Create Scan Response
export const CreateScanResponseSchema = z.object({
  scanId: z.string().uuid(),
  status: ScanStatusSchema
});
export type CreateScanResponse = z.infer<typeof CreateScanResponseSchema>;

// Get Scan Response
export const GetScanResponseSchema = z.object({
  id: z.string().uuid(),
  status: ScanStatusSchema,
  createdAt: z.string().datetime(),
  imageUrl: z.string().url().optional(),
  candidates: z.array(AiCandidateSchema).optional(),
  evidence: AiEvidenceSchema.optional(),
  confirmedTitle: z.string().optional(),
  confirmedEdition: z.string().optional(),
  confirmedLanguage: GameLanguageSchema.optional(),
  confirmedCondition: GameConditionSchema.optional(),
  error: z.string().optional()
});
export type GetScanResponse = z.infer<typeof GetScanResponseSchema>;

// Confirm Scan Request
export const ConfirmScanRequestSchema = z.object({
  title: z.string().min(1).max(200),
  edition: z.string().max(100).optional(),
  language: GameLanguageSchema,
  condition: GameConditionSchema,
  isComplete: z.boolean()
});
export type ConfirmScanRequest = z.infer<typeof ConfirmScanRequestSchema>;

// Confirm Scan Response
export const ConfirmScanResponseSchema = z.object({
  scanId: z.string().uuid(),
  normalizedTitle: z.string(),
  keywords: z.array(z.string()),
  status: ScanStatusSchema
});
export type ConfirmScanResponse = z.infer<typeof ConfirmScanResponseSchema>;
