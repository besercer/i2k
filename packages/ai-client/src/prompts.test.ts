import { describe, it, expect } from 'vitest';
import { PROMPTS, JSON_SCHEMAS } from './prompts';

describe('PROMPTS', () => {
  describe('recognition', () => {
    it('should have system and user prompts', () => {
      expect(PROMPTS.recognition.system).toBeDefined();
      expect(PROMPTS.recognition.user).toBeDefined();
      expect(typeof PROMPTS.recognition.system).toBe('string');
      expect(typeof PROMPTS.recognition.user).toBe('string');
    });

    it('should mention JSON in system prompt', () => {
      expect(PROMPTS.recognition.system.toLowerCase()).toContain('json');
    });
  });

  describe('normalization', () => {
    it('should have system prompt and user function', () => {
      expect(PROMPTS.normalization.system).toBeDefined();
      expect(PROMPTS.normalization.user).toBeDefined();
      expect(typeof PROMPTS.normalization.system).toBe('string');
      expect(typeof PROMPTS.normalization.user).toBe('function');
    });

    it('should generate user prompt with input', () => {
      const prompt = PROMPTS.normalization.user('Catan', 'Die Siedler von Catan');
      expect(prompt).toContain('Catan');
      expect(prompt).toContain('Die Siedler von Catan');
    });

    it('should work without original suggestion', () => {
      const prompt = PROMPTS.normalization.user('Test Game');
      expect(prompt).toContain('Test Game');
    });
  });

  describe('pricing', () => {
    it('should have system prompt and user function', () => {
      expect(PROMPTS.pricing.system).toBeDefined();
      expect(PROMPTS.pricing.user).toBeDefined();
    });

    it('should generate user prompt with game details', () => {
      const prompt = PROMPTS.pricing.user(
        'Catan',
        'Gut',
        true,
        [{ source: 'Manual', price: 25, conditionHint: 'Sehr gut' }]
      );
      expect(prompt).toContain('Catan');
      expect(prompt).toContain('Gut');
      expect(prompt).toContain('Ja');
      expect(prompt).toContain('25');
    });

    it('should format incomplete game correctly', () => {
      const prompt = PROMPTS.pricing.user('Test', 'Gut', false, []);
      expect(prompt).toContain('Nein');
    });
  });

  describe('listing', () => {
    it('should have system prompt and user function', () => {
      expect(PROMPTS.listing.system).toBeDefined();
      expect(PROMPTS.listing.user).toBeDefined();
    });

    it('should generate user prompt with all details', () => {
      const prompt = PROMPTS.listing.user({
        gameTitle: 'Catan',
        edition: 'Basisspiel',
        condition: 'Gut',
        language: 'Deutsch',
        isComplete: true,
        price: 25,
        pickupLocation: 'Berlin',
        shippingAvailable: true,
        paypalAvailable: true,
        additionalNotes: 'Nichtraucher'
      });

      expect(prompt).toContain('Catan');
      expect(prompt).toContain('Basisspiel');
      expect(prompt).toContain('Gut');
      expect(prompt).toContain('Deutsch');
      expect(prompt).toContain('25');
      expect(prompt).toContain('Berlin');
      expect(prompt).toContain('Nichtraucher');
    });

    it('should work without optional fields', () => {
      const prompt = PROMPTS.listing.user({
        gameTitle: 'Test',
        condition: 'Gut',
        language: 'DE',
        isComplete: false,
        price: 20,
        shippingAvailable: false,
        paypalAvailable: false
      });

      expect(prompt).toContain('Test');
      expect(prompt).toContain('Nein');
    });
  });
});

describe('JSON_SCHEMAS', () => {
  describe('recognition schema', () => {
    it('should have required fields', () => {
      expect(JSON_SCHEMAS.recognition.required).toContain('best');
      expect(JSON_SCHEMAS.recognition.required).toContain('alternatives');
      expect(JSON_SCHEMAS.recognition.required).toContain('evidence');
      expect(JSON_SCHEMAS.recognition.required).toContain('needsConfirmation');
    });

    it('should define confidence range', () => {
      const confidenceSchema = JSON_SCHEMAS.recognition.properties.best.properties.confidence;
      expect(confidenceSchema.minimum).toBe(0);
      expect(confidenceSchema.maximum).toBe(100);
    });
  });

  describe('normalization schema', () => {
    it('should have required fields', () => {
      expect(JSON_SCHEMAS.normalization.required).toContain('normalizedTitle');
      expect(JSON_SCHEMAS.normalization.required).toContain('keywords');
    });
  });

  describe('pricing schema', () => {
    it('should have all price fields', () => {
      const required = JSON_SCHEMAS.pricing.required;
      expect(required).toContain('recommendedPrice');
      expect(required).toContain('quickSalePrice');
      expect(required).toContain('negotiationAnchor');
      expect(required).toContain('rangeLow');
      expect(required).toContain('rangeHigh');
    });
  });

  describe('listing schema', () => {
    it('should require 3 title variants', () => {
      const titleVariants = JSON_SCHEMAS.listing.properties.titleVariants;
      expect(titleVariants.minItems).toBe(3);
      expect(titleVariants.maxItems).toBe(3);
    });

    it('should require 5 bullet points', () => {
      const bulletPoints = JSON_SCHEMAS.listing.properties.bulletPoints;
      expect(bulletPoints.minItems).toBe(5);
      expect(bulletPoints.maxItems).toBe(5);
    });

    it('should require 5 search tags', () => {
      const searchTags = JSON_SCHEMAS.listing.properties.searchTags;
      expect(searchTags.minItems).toBe(5);
      expect(searchTags.maxItems).toBe(5);
    });

    it('should limit description length', () => {
      const description = JSON_SCHEMAS.listing.properties.description;
      expect(description.maxLength).toBe(1500);
    });
  });
});
