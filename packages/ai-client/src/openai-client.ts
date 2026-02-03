import OpenAI from 'openai';
import type {
  AiClient,
  AiClientConfig,
  RecognitionRequest,
  NormalizationRequest,
  NormalizationResult,
  PricingAnalysisRequest,
  PricingAnalysisResult,
  ListingGenerationRequest,
  ListingGenerationResult
} from './types';
import type { AiRecognitionResult } from '@i2k/shared';
import { PROMPTS, JSON_SCHEMAS } from './prompts';

const CONDITION_LABELS: Record<string, string> = {
  NEW: 'Neu (originalverpackt)',
  LIKE_NEW: 'Wie neu',
  VERY_GOOD: 'Sehr gut',
  GOOD: 'Gut',
  ACCEPTABLE: 'Akzeptabel'
};

const LANGUAGE_LABELS: Record<string, string> = {
  DE: 'Deutsch',
  EN: 'Englisch',
  FR: 'Französisch',
  ES: 'Spanisch',
  IT: 'Italienisch',
  NL: 'Niederländisch',
  OTHER: 'Andere'
};

export class OpenAiClient implements AiClient {
  private client: OpenAI;
  private model: string;
  private visionModel: string;

  constructor(config: AiClientConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      maxRetries: config.maxRetries ?? 3,
      timeout: config.timeout ?? 60000
    });
    this.model = config.model ?? 'gpt-4o';
    this.visionModel = 'gpt-4o'; // Vision requires gpt-4o
  }

  async recognizeGame(request: RecognitionRequest): Promise<AiRecognitionResult> {
    const response = await this.client.chat.completions.create({
      model: this.visionModel,
      messages: [
        {
          role: 'system',
          content: PROMPTS.recognition.system
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: PROMPTS.recognition.user
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${request.image.mimeType};base64,${request.image.base64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'game_recognition',
          strict: true,
          schema: JSON_SCHEMAS.recognition
        }
      },
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    return JSON.parse(content) as AiRecognitionResult;
  }

  async normalizeTitle(request: NormalizationRequest): Promise<NormalizationResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: PROMPTS.normalization.system
        },
        {
          role: 'user',
          content: PROMPTS.normalization.user(request.userInput, request.originalSuggestion)
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'title_normalization',
          strict: true,
          schema: JSON_SCHEMAS.normalization
        }
      },
      max_tokens: 500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    return JSON.parse(content) as NormalizationResult;
  }

  async analyzePricing(request: PricingAnalysisRequest): Promise<PricingAnalysisResult> {
    const samples = request.priceSamples.map(s => ({
      source: s.source,
      price: s.price,
      conditionHint: s.conditionHint
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: PROMPTS.pricing.system
        },
        {
          role: 'user',
          content: PROMPTS.pricing.user(
            request.gameTitle,
            CONDITION_LABELS[request.condition] || request.condition,
            request.isComplete,
            samples
          )
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'pricing_analysis',
          strict: true,
          schema: JSON_SCHEMAS.pricing
        }
      },
      max_tokens: 800
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    return JSON.parse(content) as PricingAnalysisResult;
  }

  async generateListing(request: ListingGenerationRequest): Promise<ListingGenerationResult> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: PROMPTS.listing.system
        },
        {
          role: 'user',
          content: PROMPTS.listing.user({
            gameTitle: request.gameTitle,
            edition: request.edition,
            condition: CONDITION_LABELS[request.condition] || request.condition,
            language: LANGUAGE_LABELS[request.language] || request.language,
            isComplete: request.isComplete,
            price: request.price,
            pickupLocation: request.pickupLocation,
            shippingAvailable: request.shippingAvailable,
            paypalAvailable: request.paypalAvailable,
            additionalNotes: request.additionalNotes
          })
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'listing_generation',
          strict: true,
          schema: JSON_SCHEMAS.listing
        }
      },
      max_tokens: 1500
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response content from AI');
    }

    return JSON.parse(content) as ListingGenerationResult;
  }
}
