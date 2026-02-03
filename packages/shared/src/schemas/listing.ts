import { z } from 'zod';

// Listing Draft Request
export const DraftRequestSchema = z.object({
  price: z.number().positive(),
  pickupLocation: z.string().max(100).optional(),
  shippingAvailable: z.boolean().default(false),
  paypalAvailable: z.boolean().default(false),
  additionalNotes: z.string().max(500).optional()
});
export type DraftRequest = z.infer<typeof DraftRequestSchema>;

// Title Variant
export const TitleVariantSchema = z.object({
  title: z.string().max(65),
  style: z.enum(['NEUTRAL', 'URGENT', 'FRIENDLY'])
});
export type TitleVariant = z.infer<typeof TitleVariantSchema>;

// Listing Draft Response
export const DraftResponseSchema = z.object({
  scanId: z.string().uuid(),
  titleVariants: z.array(TitleVariantSchema).length(3),
  description: z.string().max(1500),
  bulletPoints: z.array(z.string()).length(5),
  searchTags: z.array(z.string()).length(5),
  suggestedPrice: z.number().positive(),
  metadata: z.object({
    gameTitle: z.string(),
    condition: z.string(),
    language: z.string(),
    isComplete: z.boolean()
  })
});
export type DraftResponse = z.infer<typeof DraftResponseSchema>;
