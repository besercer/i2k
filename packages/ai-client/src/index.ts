export * from './types';
export * from './prompts';
export { OpenAiClient } from './openai-client';
export { MockAiClient } from './mock-client';

import type { AiClient, AiClientConfig } from './types';
import { OpenAiClient } from './openai-client';
import { MockAiClient } from './mock-client';

export type AiProvider = 'openai' | 'mock';

export interface CreateAiClientOptions extends AiClientConfig {
  provider?: AiProvider;
}

/**
 * Factory function to create an AI client based on configuration.
 */
export function createAiClient(options: CreateAiClientOptions): AiClient {
  const provider = options.provider ?? 'openai';

  switch (provider) {
    case 'mock':
      return new MockAiClient();
    case 'openai':
    default:
      return new OpenAiClient(options);
  }
}
