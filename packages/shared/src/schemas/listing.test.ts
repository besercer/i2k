import { describe, it, expect } from 'vitest';
import {
  DraftRequestSchema,
  TitleVariantSchema,
  DraftResponseSchema
} from './listing';

describe('DraftRequestSchema', () => {
  it('should accept valid draft request', () => {
    const request = {
      price: 25,
      pickupLocation: 'Berlin 10115',
      shippingAvailable: true,
      paypalAvailable: true,
      additionalNotes: 'Originalverpackt'
    };
    expect(DraftRequestSchema.parse(request)).toEqual(request);
  });

  it('should accept minimal request with just price', () => {
    const request = {
      price: 20
    };
    const parsed = DraftRequestSchema.parse(request);
    expect(parsed.price).toBe(20);
    expect(parsed.shippingAvailable).toBe(false);
    expect(parsed.paypalAvailable).toBe(false);
  });

  it('should reject zero or negative price', () => {
    expect(() => DraftRequestSchema.parse({ price: 0 })).toThrow();
    expect(() => DraftRequestSchema.parse({ price: -10 })).toThrow();
  });

  it('should reject pickup location over 100 chars', () => {
    expect(() => DraftRequestSchema.parse({
      price: 25,
      pickupLocation: 'a'.repeat(101)
    })).toThrow();
  });

  it('should reject additional notes over 500 chars', () => {
    expect(() => DraftRequestSchema.parse({
      price: 25,
      additionalNotes: 'a'.repeat(501)
    })).toThrow();
  });
});

describe('TitleVariantSchema', () => {
  it('should accept valid title variant', () => {
    const variant = {
      title: 'Die Siedler von Catan - Sehr gut erhalten!',
      style: 'NEUTRAL'
    };
    expect(TitleVariantSchema.parse(variant)).toEqual(variant);
  });

  it('should accept all style types', () => {
    const styles = ['NEUTRAL', 'URGENT', 'FRIENDLY'];
    styles.forEach(style => {
      expect(TitleVariantSchema.parse({ title: 'Test', style })).toEqual({ title: 'Test', style });
    });
  });

  it('should reject title over 65 chars', () => {
    expect(() => TitleVariantSchema.parse({
      title: 'a'.repeat(66),
      style: 'NEUTRAL'
    })).toThrow();
  });

  it('should reject invalid style', () => {
    expect(() => TitleVariantSchema.parse({
      title: 'Test',
      style: 'AGGRESSIVE'
    })).toThrow();
  });
});

describe('DraftResponseSchema', () => {
  it('should accept valid draft response', () => {
    const response = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      titleVariants: [
        { title: 'Catan - Sehr gut', style: 'NEUTRAL' },
        { title: 'Catan TOP!', style: 'URGENT' },
        { title: 'Catan sucht neues Zuhause', style: 'FRIENDLY' }
      ],
      description: 'Verkaufe hier mein geliebtes Catan Basisspiel...',
      bulletPoints: ['Zustand: Gut', 'Vollständig', 'Deutsch', 'Nichtraucher', 'Versand möglich'],
      searchTags: ['catan', 'brettspiel', 'siedler', 'familienspiel', 'kosmos'],
      suggestedPrice: 25,
      metadata: {
        gameTitle: 'Die Siedler von Catan',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true
      }
    };
    expect(DraftResponseSchema.parse(response)).toEqual(response);
  });

  it('should require exactly 3 title variants', () => {
    const baseResponse = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      titleVariants: [
        { title: 'Test 1', style: 'NEUTRAL' },
        { title: 'Test 2', style: 'URGENT' }
      ],
      description: 'Test',
      bulletPoints: ['1', '2', '3', '4', '5'],
      searchTags: ['a', 'b', 'c', 'd', 'e'],
      suggestedPrice: 25,
      metadata: { gameTitle: 'Test', condition: 'GOOD', language: 'DE', isComplete: true }
    };
    expect(() => DraftResponseSchema.parse(baseResponse)).toThrow();
  });

  it('should require exactly 5 bullet points', () => {
    const baseResponse = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      titleVariants: [
        { title: 'Test 1', style: 'NEUTRAL' },
        { title: 'Test 2', style: 'URGENT' },
        { title: 'Test 3', style: 'FRIENDLY' }
      ],
      description: 'Test',
      bulletPoints: ['1', '2', '3'],
      searchTags: ['a', 'b', 'c', 'd', 'e'],
      suggestedPrice: 25,
      metadata: { gameTitle: 'Test', condition: 'GOOD', language: 'DE', isComplete: true }
    };
    expect(() => DraftResponseSchema.parse(baseResponse)).toThrow();
  });

  it('should require exactly 5 search tags', () => {
    const baseResponse = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      titleVariants: [
        { title: 'Test 1', style: 'NEUTRAL' },
        { title: 'Test 2', style: 'URGENT' },
        { title: 'Test 3', style: 'FRIENDLY' }
      ],
      description: 'Test',
      bulletPoints: ['1', '2', '3', '4', '5'],
      searchTags: ['a', 'b'],
      suggestedPrice: 25,
      metadata: { gameTitle: 'Test', condition: 'GOOD', language: 'DE', isComplete: true }
    };
    expect(() => DraftResponseSchema.parse(baseResponse)).toThrow();
  });

  it('should reject description over 1500 chars', () => {
    const baseResponse = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      titleVariants: [
        { title: 'Test 1', style: 'NEUTRAL' },
        { title: 'Test 2', style: 'URGENT' },
        { title: 'Test 3', style: 'FRIENDLY' }
      ],
      description: 'a'.repeat(1501),
      bulletPoints: ['1', '2', '3', '4', '5'],
      searchTags: ['a', 'b', 'c', 'd', 'e'],
      suggestedPrice: 25,
      metadata: { gameTitle: 'Test', condition: 'GOOD', language: 'DE', isComplete: true }
    };
    expect(() => DraftResponseSchema.parse(baseResponse)).toThrow();
  });
});
