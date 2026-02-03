import { describe, it, expect } from 'vitest';
import {
  PriceSourceSchema,
  PriceSampleSchema,
  ManualPriceInputSchema,
  PricingRequestSchema,
  PricingResponseSchema
} from './pricing';

describe('PriceSourceSchema', () => {
  it('should accept valid price sources', () => {
    const validSources = ['MANUAL', 'KLEINANZEIGEN', 'BGG', 'OTHER'];
    validSources.forEach(source => {
      expect(PriceSourceSchema.parse(source)).toBe(source);
    });
  });

  it('should reject invalid price source', () => {
    expect(() => PriceSourceSchema.parse('EBAY')).toThrow();
  });
});

describe('PriceSampleSchema', () => {
  it('should accept valid price sample', () => {
    const sample = {
      source: 'MANUAL',
      price: 25.99,
      currency: 'EUR',
      conditionHint: 'Gut erhalten',
      timestamp: '2024-01-15T12:00:00.000Z',
      url: 'https://example.com/listing'
    };
    expect(PriceSampleSchema.parse(sample)).toEqual(sample);
  });

  it('should default currency to EUR', () => {
    const sample = {
      source: 'KLEINANZEIGEN',
      price: 30,
      timestamp: '2024-01-15T12:00:00.000Z'
    };
    const parsed = PriceSampleSchema.parse(sample);
    expect(parsed.currency).toBe('EUR');
  });

  it('should reject zero or negative price', () => {
    expect(() => PriceSampleSchema.parse({
      source: 'MANUAL',
      price: 0,
      timestamp: '2024-01-15T12:00:00.000Z'
    })).toThrow();

    expect(() => PriceSampleSchema.parse({
      source: 'MANUAL',
      price: -10,
      timestamp: '2024-01-15T12:00:00.000Z'
    })).toThrow();
  });

  it('should reject invalid URL', () => {
    expect(() => PriceSampleSchema.parse({
      source: 'MANUAL',
      price: 25,
      timestamp: '2024-01-15T12:00:00.000Z',
      url: 'not-a-url'
    })).toThrow();
  });
});

describe('ManualPriceInputSchema', () => {
  it('should accept valid manual price input', () => {
    const input = {
      prices: [
        { price: 25, conditionHint: 'Gut' },
        { price: 30, source: 'Kleinanzeigen' }
      ]
    };
    expect(ManualPriceInputSchema.parse(input)).toEqual(input);
  });

  it('should accept single price', () => {
    const input = {
      prices: [{ price: 20 }]
    };
    expect(ManualPriceInputSchema.parse(input)).toEqual(input);
  });

  it('should reject empty prices array', () => {
    expect(() => ManualPriceInputSchema.parse({ prices: [] })).toThrow();
  });

  it('should reject more than 5 prices', () => {
    const input = {
      prices: [
        { price: 10 }, { price: 20 }, { price: 30 },
        { price: 40 }, { price: 50 }, { price: 60 }
      ]
    };
    expect(() => ManualPriceInputSchema.parse(input)).toThrow();
  });
});

describe('PricingRequestSchema', () => {
  it('should accept request with manual prices', () => {
    const request = {
      manualPrices: {
        prices: [{ price: 25 }]
      }
    };
    expect(PricingRequestSchema.parse(request)).toEqual(request);
  });

  it('should accept empty request', () => {
    expect(PricingRequestSchema.parse({})).toEqual({});
  });
});

describe('PricingResponseSchema', () => {
  it('should accept valid pricing response', () => {
    const response = {
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      recommendedPrice: 28,
      quickSalePrice: 22,
      negotiationAnchor: 32,
      rangeLow: 20,
      rangeHigh: 35,
      samples: [{
        source: 'MANUAL',
        price: 25,
        currency: 'EUR',
        timestamp: '2024-01-15T12:00:00.000Z'
      }],
      reasoningBullets: ['Based on 3 comparable listings', 'Good condition premium applied'],
      confidence: 85
    };
    expect(PricingResponseSchema.parse(response)).toEqual(response);
  });

  it('should reject confidence > 100', () => {
    expect(() => PricingResponseSchema.parse({
      scanId: '550e8400-e29b-41d4-a716-446655440000',
      recommendedPrice: 28,
      quickSalePrice: 22,
      negotiationAnchor: 32,
      rangeLow: 20,
      rangeHigh: 35,
      samples: [],
      reasoningBullets: [],
      confidence: 150
    })).toThrow();
  });
});
