import { describe, it, expect, beforeEach } from 'vitest';
import { MockAiClient } from './mock-client';

describe('MockAiClient', () => {
  let client: MockAiClient;

  beforeEach(() => {
    client = new MockAiClient({ delay: 0 }); // No delay for faster tests
  });

  describe('recognizeGame', () => {
    it('should return recognition result with best match', async () => {
      const result = await client.recognizeGame({
        image: {
          base64: 'fake-base64-data',
          mimeType: 'image/jpeg'
        }
      });

      expect(result.best).toBeDefined();
      expect(result.best.title).toBe('Die Siedler von Catan');
      expect(result.best.confidence).toBeGreaterThan(0);
      expect(result.best.confidence).toBeLessThanOrEqual(100);
    });

    it('should return alternatives', async () => {
      const result = await client.recognizeGame({
        image: {
          base64: 'fake-base64-data',
          mimeType: 'image/jpeg'
        }
      });

      expect(result.alternatives).toBeDefined();
      expect(result.alternatives.length).toBeGreaterThan(0);
    });

    it('should return evidence', async () => {
      const result = await client.recognizeGame({
        image: {
          base64: 'fake-base64-data',
          mimeType: 'image/jpeg'
        }
      });

      expect(result.evidence).toBeDefined();
      expect(result.evidence.visibleText).toBeInstanceOf(Array);
      expect(result.evidence.visualCues).toBeInstanceOf(Array);
    });

    it('should include needsConfirmation flag', async () => {
      const result = await client.recognizeGame({
        image: {
          base64: 'fake-base64-data',
          mimeType: 'image/jpeg'
        }
      });

      expect(typeof result.needsConfirmation).toBe('boolean');
    });
  });

  describe('normalizeTitle', () => {
    it('should return normalized title', async () => {
      const result = await client.normalizeTitle({
        userInput: 'catan',
        originalSuggestion: 'Die Siedler von Catan'
      });

      expect(result.normalizedTitle).toBe('catan');
      expect(result.keywords).toBeInstanceOf(Array);
      expect(result.keywords.length).toBeGreaterThan(0);
    });

    it('should work without original suggestion', async () => {
      const result = await client.normalizeTitle({
        userInput: 'Ticket to Ride'
      });

      expect(result.normalizedTitle).toBeDefined();
    });

    it('should trim whitespace from user input', async () => {
      const result = await client.normalizeTitle({
        userInput: '  Catan  '
      });

      expect(result.normalizedTitle).toBe('Catan');
    });
  });

  describe('analyzePricing', () => {
    it('should return pricing analysis with all required fields', async () => {
      const result = await client.analyzePricing({
        gameTitle: 'Catan',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        priceSamples: [
          { source: 'MANUAL', price: 20, currency: 'EUR', timestamp: new Date().toISOString() },
          { source: 'MANUAL', price: 25, currency: 'EUR', timestamp: new Date().toISOString() },
          { source: 'MANUAL', price: 30, currency: 'EUR', timestamp: new Date().toISOString() }
        ]
      });

      expect(result.recommendedPrice).toBeGreaterThan(0);
      expect(result.quickSalePrice).toBeGreaterThan(0);
      expect(result.negotiationAnchor).toBeGreaterThan(0);
      expect(result.rangeLow).toBeGreaterThan(0);
      expect(result.rangeHigh).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should adjust price based on condition', async () => {
      const samples = [
        { source: 'MANUAL' as const, price: 30, currency: 'EUR' as const, timestamp: new Date().toISOString() }
      ];

      const newCondition = await client.analyzePricing({
        gameTitle: 'Test',
        condition: 'NEW',
        language: 'DE',
        isComplete: true,
        priceSamples: samples
      });

      const goodCondition = await client.analyzePricing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        priceSamples: samples
      });

      expect(newCondition.recommendedPrice).toBeGreaterThan(goodCondition.recommendedPrice);
    });

    it('should have lower confidence with fewer samples', async () => {
      const fewSamples = await client.analyzePricing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        priceSamples: [
          { source: 'MANUAL', price: 25, currency: 'EUR', timestamp: new Date().toISOString() }
        ]
      });

      const manySamples = await client.analyzePricing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        priceSamples: [
          { source: 'MANUAL', price: 20, currency: 'EUR', timestamp: new Date().toISOString() },
          { source: 'MANUAL', price: 25, currency: 'EUR', timestamp: new Date().toISOString() },
          { source: 'MANUAL', price: 30, currency: 'EUR', timestamp: new Date().toISOString() }
        ]
      });

      expect(fewSamples.confidence).toBeLessThan(manySamples.confidence);
    });

    it('should handle empty samples array', async () => {
      const result = await client.analyzePricing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        priceSamples: []
      });

      expect(result.recommendedPrice).toBeGreaterThan(0);
    });
  });

  describe('generateListing', () => {
    it('should return listing with all required fields', async () => {
      const result = await client.generateListing({
        gameTitle: 'Die Siedler von Catan',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        price: 25,
        shippingAvailable: true,
        paypalAvailable: true
      });

      expect(result.titleVariants).toHaveLength(3);
      expect(result.description).toBeDefined();
      expect(result.description.length).toBeGreaterThan(0);
      expect(result.bulletPoints).toHaveLength(5);
      expect(result.searchTags).toHaveLength(5);
    });

    it('should include different title styles', async () => {
      const result = await client.generateListing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        price: 20,
        shippingAvailable: false,
        paypalAvailable: false
      });

      const styles = result.titleVariants.map(v => v.style);
      expect(styles).toContain('NEUTRAL');
      expect(styles).toContain('URGENT');
      expect(styles).toContain('FRIENDLY');
    });

    it('should include pickup location when provided', async () => {
      const result = await client.generateListing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        price: 20,
        pickupLocation: 'Berlin',
        shippingAvailable: false,
        paypalAvailable: false
      });

      expect(result.description).toContain('Berlin');
    });

    it('should mention shipping when available', async () => {
      const result = await client.generateListing({
        gameTitle: 'Test',
        condition: 'GOOD',
        language: 'DE',
        isComplete: true,
        price: 20,
        shippingAvailable: true,
        paypalAvailable: false
      });

      expect(result.description.toLowerCase()).toContain('versand');
    });
  });
});

describe('MockAiClient with delay', () => {
  it('should simulate delay', async () => {
    const client = new MockAiClient({ delay: 50 });
    const start = Date.now();

    await client.recognizeGame({
      image: { base64: 'test', mimeType: 'image/jpeg' }
    });

    const duration = Date.now() - start;
    expect(duration).toBeGreaterThanOrEqual(45); // Allow small timing variance
  });
});
