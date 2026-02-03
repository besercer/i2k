import type {
  AiClient,
  RecognitionRequest,
  NormalizationRequest,
  NormalizationResult,
  PricingAnalysisRequest,
  PricingAnalysisResult,
  ListingGenerationRequest,
  ListingGenerationResult
} from './types';
import type { AiRecognitionResult } from '@i2k/shared';

/**
 * Mock AI client for testing purposes.
 * Returns predictable, realistic responses without making actual API calls.
 */
export class MockAiClient implements AiClient {
  private delay: number;

  constructor(options: { delay?: number } = {}) {
    this.delay = options.delay ?? 100;
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, this.delay));
  }

  async recognizeGame(_request: RecognitionRequest): Promise<AiRecognitionResult> {
    await this.simulateDelay();

    return {
      best: {
        title: 'Die Siedler von Catan',
        edition: 'Basisspiel',
        languageGuess: 'DE',
        confidence: 92
      },
      alternatives: [
        {
          title: 'Catan - Das Spiel',
          edition: 'Jubiläumsausgabe',
          confidence: 45
        },
        {
          title: 'Catan Universe',
          confidence: 20
        }
      ],
      evidence: {
        visibleText: ['CATAN', 'KOSMOS', 'Klaus Teuber'],
        visualCues: ['Hexagonal tiles visible', 'Resource cards', 'Wooden pieces']
      },
      needsConfirmation: false
    };
  }

  async normalizeTitle(request: NormalizationRequest): Promise<NormalizationResult> {
    await this.simulateDelay();

    return {
      normalizedTitle: request.userInput.trim(),
      keywords: [
        request.userInput.toLowerCase(),
        'brettspiel',
        'gesellschaftsspiel'
      ],
      editionHints: undefined
    };
  }

  async analyzePricing(request: PricingAnalysisRequest): Promise<PricingAnalysisResult> {
    await this.simulateDelay();

    // Calculate mock prices based on samples
    const prices = request.priceSamples.map(s => s.price);
    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 25;

    const conditionMultiplier = {
      NEW: 1.2,
      LIKE_NEW: 1.1,
      VERY_GOOD: 1.0,
      GOOD: 0.85,
      ACCEPTABLE: 0.7
    }[request.condition] ?? 1.0;

    const basePrice = avgPrice * conditionMultiplier;

    return {
      recommendedPrice: Math.round(basePrice),
      quickSalePrice: Math.round(basePrice * 0.8),
      negotiationAnchor: Math.round(basePrice * 1.15),
      rangeLow: Math.round(basePrice * 0.7),
      rangeHigh: Math.round(basePrice * 1.3),
      reasoningBullets: [
        `Durchschnittspreis basierend auf ${prices.length} Vergleichsangeboten`,
        `Zustand "${request.condition}" berücksichtigt`,
        request.isComplete
          ? 'Vollständiges Spiel - kein Abzug'
          : 'Möglicherweise unvollständig - Preisabzug empfohlen'
      ],
      confidence: prices.length >= 3 ? 85 : 60
    };
  }

  async generateListing(request: ListingGenerationRequest): Promise<ListingGenerationResult> {
    await this.simulateDelay();

    const title = request.gameTitle;
    const condition = request.condition;

    return {
      titleVariants: [
        {
          title: `${title} - ${condition}`,
          style: 'NEUTRAL'
        },
        {
          title: `${title} ⭐ TOP Zustand!`,
          style: 'URGENT'
        },
        {
          title: `${title} sucht neues Zuhause 🎲`,
          style: 'FRIENDLY'
        }
      ],
      description: `Verkaufe hier "${title}" in ${condition.toLowerCase()}em Zustand.

Das Spiel ist ${request.isComplete ? 'vollständig' : 'möglicherweise unvollständig'} und wurde pfleglich behandelt.

${request.shippingAvailable ? '📦 Versand möglich' : ''}
${request.pickupLocation ? `📍 Abholung in ${request.pickupLocation}` : ''}
${request.paypalAvailable ? '💳 PayPal akzeptiert' : ''}

Bei Fragen einfach melden!`,
      bulletPoints: [
        `Zustand: ${condition}`,
        `Sprache: ${request.language}`,
        request.isComplete ? 'Vollständig' : 'Vollständigkeit prüfen',
        request.shippingAvailable ? 'Versand möglich' : 'Nur Abholung',
        'Nichtraucherhaushalt'
      ],
      searchTags: [
        title.toLowerCase().replace(/\s+/g, ''),
        'brettspiel',
        'gesellschaftsspiel',
        'spiel',
        'familienspiel'
      ]
    };
  }
}
