import { z } from 'zod';

// Price Provider Source
export const PriceSourceSchema = z.enum([
  'MANUAL',
  'KLEINANZEIGEN',
  'BGG',
  'OTHER'
]);
export type PriceSource = z.infer<typeof PriceSourceSchema>;

// Price Sample (from various sources)
export const PriceSampleSchema = z.object({
  source: PriceSourceSchema,
  price: z.number().positive(),
  currency: z.literal('EUR').default('EUR'),
  conditionHint: z.string().optional(),
  timestamp: z.string().datetime(),
  url: z.string().url().optional()
});
export type PriceSample = z.infer<typeof PriceSampleSchema>;

// Manual Price Input Request
export const ManualPriceInputSchema = z.object({
  prices: z.array(z.object({
    price: z.number().positive(),
    conditionHint: z.string().optional(),
    source: z.string().optional()
  })).min(1).max(5)
});
export type ManualPriceInput = z.infer<typeof ManualPriceInputSchema>;

// Pricing Request
export const PricingRequestSchema = z.object({
  manualPrices: ManualPriceInputSchema.optional()
});
export type PricingRequest = z.infer<typeof PricingRequestSchema>;

// Pricing Response
export const PricingResponseSchema = z.object({
  scanId: z.string().uuid(),
  recommendedPrice: z.number().positive(),
  quickSalePrice: z.number().positive(),
  negotiationAnchor: z.number().positive(),
  rangeLow: z.number().positive(),
  rangeHigh: z.number().positive(),
  samples: z.array(PriceSampleSchema),
  reasoningBullets: z.array(z.string()),
  confidence: z.number().int().min(0).max(100)
});
export type PricingResponse = z.infer<typeof PricingResponseSchema>;
