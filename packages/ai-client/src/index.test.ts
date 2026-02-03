import { describe, it, expect } from 'vitest';
import { createAiClient, MockAiClient, OpenAiClient } from './index';

describe('createAiClient', () => {
  it('should create MockAiClient when provider is mock', () => {
    const client = createAiClient({
      apiKey: 'test-key',
      provider: 'mock'
    });

    expect(client).toBeInstanceOf(MockAiClient);
  });

  it('should create OpenAiClient when provider is openai', () => {
    const client = createAiClient({
      apiKey: 'test-key',
      provider: 'openai'
    });

    expect(client).toBeInstanceOf(OpenAiClient);
  });

  it('should default to OpenAiClient when no provider specified', () => {
    const client = createAiClient({
      apiKey: 'test-key'
    });

    expect(client).toBeInstanceOf(OpenAiClient);
  });
});

describe('exports', () => {
  it('should export all required types', async () => {
    const exports = await import('./index');

    expect(exports.createAiClient).toBeDefined();
    expect(exports.MockAiClient).toBeDefined();
    expect(exports.OpenAiClient).toBeDefined();
    expect(exports.PROMPTS).toBeDefined();
    expect(exports.JSON_SCHEMAS).toBeDefined();
  });
});
