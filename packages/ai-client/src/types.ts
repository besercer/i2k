import type {
  AiRecognitionResult,
  PriceSample,
  GameCondition,
  GameLanguage
} from '@i2k/shared';

export interface ImageInput {
  base64: string;
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp';
}

export interface RecognitionRequest {
  image: ImageInput;
}

export interface NormalizationRequest {
  userInput: string;
  originalSuggestion?: string;
}

export interface NormalizationResult {
  normalizedTitle: string;
  keywords: string[];
  editionHints?: string;
}

export interface PricingAnalysisRequest {
  gameTitle: string;
  edition?: string;
  condition: GameCondition;
  language: GameLanguage;
  isComplete: boolean;
  priceSamples: PriceSample[];
}

export interface PricingAnalysisResult {
  recommendedPrice: number;
  quickSalePrice: number;
  negotiationAnchor: number;
  rangeLow: number;
  rangeHigh: number;
  reasoningBullets: string[];
  confidence: number;
}

export interface ListingGenerationRequest {
  gameTitle: string;
  edition?: string;
  condition: GameCondition;
  language: GameLanguage;
  isComplete: boolean;
  price: number;
  pickupLocation?: string;
  shippingAvailable: boolean;
  paypalAvailable: boolean;
  additionalNotes?: string;
}

export interface TitleVariant {
  title: string;
  style: 'NEUTRAL' | 'URGENT' | 'FRIENDLY';
}

export interface ListingGenerationResult {
  titleVariants: TitleVariant[];
  description: string;
  bulletPoints: string[];
  searchTags: string[];
}

export interface AiClient {
  recognizeGame(request: RecognitionRequest): Promise<AiRecognitionResult>;
  normalizeTitle(request: NormalizationRequest): Promise<NormalizationResult>;
  analyzePricing(request: PricingAnalysisRequest): Promise<PricingAnalysisResult>;
  generateListing(request: ListingGenerationRequest): Promise<ListingGenerationResult>;
}

export interface AiClientConfig {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  timeout?: number;
}
