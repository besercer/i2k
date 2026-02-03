import { prisma, Prisma, Scan, ScanStatus, GameCondition, GameLanguage } from '@i2k/database';
import {
  createAiClient,
  type AiClient,
  type AiProvider,
  type PricingAnalysisResult,
  type ListingGenerationResult
} from '@i2k/ai-client';
import {
  type AiCandidate,
  type PriceSample
} from '@i2k/shared';
import { fileService } from './file.service';
import { AppError } from '../plugins/error-handler';
import { ErrorCodes } from '@i2k/shared';
import { env } from '../config/env';

export interface CreateScanResult {
  scanId: string;
  status: ScanStatus;
}

export interface ConfirmScanInput {
  title: string;
  edition?: string;
  language: GameLanguage;
  condition: GameCondition;
  isComplete: boolean;
}

export interface ConfirmScanResult {
  scanId: string;
  normalizedTitle: string;
  keywords: string[];
  status: ScanStatus;
}

export interface PricingInput {
  manualPrices?: Array<{
    price: number;
    conditionHint?: string;
    source?: string;
  }>;
}

export interface PricingResult {
  scanId: string;
  recommendedPrice: number;
  quickSalePrice: number;
  negotiationAnchor: number;
  rangeLow: number;
  rangeHigh: number;
  samples: PriceSample[];
  reasoningBullets: string[];
  confidence: number;
}

export interface DraftInput {
  price: number;
  pickupLocation?: string;
  shippingAvailable: boolean;
  paypalAvailable: boolean;
  additionalNotes?: string;
}

export interface DraftResult {
  scanId: string;
  titleVariants: Array<{ title: string; style: string }>;
  description: string;
  bulletPoints: string[];
  searchTags: string[];
  suggestedPrice: number;
  metadata: {
    gameTitle: string;
    condition: string;
    language: string;
    isComplete: boolean;
  };
}

export class ScanService {
  private aiClient: AiClient;

  constructor() {
    this.aiClient = createAiClient({
      apiKey: env.OPENAI_API_KEY,
      provider: env.AI_PROVIDER as AiProvider,
      model: env.AI_MODEL
    });
  }

  async createScan(
    fileStream: NodeJS.ReadableStream,
    mimeType: string,
    filename: string,
    sessionId?: string
  ): Promise<CreateScanResult> {
    // Save and process the uploaded file
    const uploadedFile = await fileService.saveUpload(fileStream, mimeType, filename);

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        imageKey: uploadedFile.key,
        imageMimeType: uploadedFile.mimeType,
        imageSize: uploadedFile.size,
        status: 'UPLOADED',
        sessionId
      }
    });

    // Start async analysis (in production, this would be a job queue)
    this.analyzeAsync(scan.id).catch(err => {
      console.error(`Analysis failed for scan ${scan.id}:`, err);
    });

    return {
      scanId: scan.id,
      status: scan.status
    };
  }

  private async analyzeAsync(scanId: string): Promise<void> {
    try {
      await prisma.scan.update({
        where: { id: scanId },
        data: { status: 'ANALYZING' }
      });

      const scan = await prisma.scan.findUnique({
        where: { id: scanId }
      });

      if (!scan) {
        throw new Error('Scan not found');
      }

      // Get image as base64
      const base64 = await fileService.getFileAsBase64(scan.imageKey);

      // Call AI for recognition
      const result = await this.aiClient.recognizeGame({
        image: {
          base64,
          mimeType: scan.imageMimeType as 'image/jpeg' | 'image/png' | 'image/webp'
        }
      });

      // Store results
      const candidates: AiCandidate[] = [
        result.best,
        ...result.alternatives
      ];

      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'ANALYZED',
          aiCandidates: candidates,
          aiEvidence: result.evidence
        }
      });
    } catch (error) {
      console.error('Analysis error:', error);
      await prisma.scan.update({
        where: { id: scanId },
        data: {
          status: 'ERROR',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  async getScan(scanId: string): Promise<Scan> {
    const scan = await prisma.scan.findUnique({
      where: { id: scanId },
      include: {
        priceSamples: true,
        listingDraft: true
      }
    });

    if (!scan) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Scan not found', 404);
    }

    return scan;
  }

  async confirmScan(scanId: string, input: ConfirmScanInput): Promise<ConfirmScanResult> {
    const scan = await this.getScan(scanId);

    if (scan.status !== 'ANALYZED' && scan.status !== 'PRICED') {
      throw new AppError(
        ErrorCodes.SCAN_NOT_READY,
        'Scan must be analyzed before confirmation',
        400
      );
    }

    // Get original suggestion for normalization
    const candidates = scan.aiCandidates as AiCandidate[] | null;
    const originalSuggestion = candidates?.[0]?.title;

    // Normalize title via AI
    const normResult = await this.aiClient.normalizeTitle({
      userInput: input.title,
      originalSuggestion
    });

    // Update scan with confirmed data
    await prisma.scan.update({
      where: { id: scanId },
      data: {
        confirmedTitle: input.title,
        confirmedEdition: input.edition,
        confirmedLanguage: input.language,
        confirmedCondition: input.condition,
        isComplete: input.isComplete,
        normalizedTitle: normResult.normalizedTitle,
        keywords: normResult.keywords
      }
    });

    return {
      scanId,
      normalizedTitle: normResult.normalizedTitle,
      keywords: normResult.keywords,
      status: scan.status
    };
  }

  async calculatePricing(scanId: string, input: PricingInput): Promise<PricingResult> {
    const scan = await this.getScan(scanId);

    if (!scan.confirmedTitle || !scan.confirmedCondition || !scan.confirmedLanguage) {
      throw new AppError(
        ErrorCodes.SCAN_NOT_READY,
        'Scan must be confirmed before pricing',
        400
      );
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PRICING' }
    });

    // Store manual price samples
    const samples: PriceSample[] = [];
    if (input.manualPrices && input.manualPrices.length > 0) {
      for (const mp of input.manualPrices) {
        const sample = await prisma.priceSample.create({
          data: {
            scanId,
            source: 'MANUAL',
            price: mp.price,
            conditionHint: mp.conditionHint,
            url: undefined
          }
        });
        samples.push({
          source: 'MANUAL',
          price: sample.price,
          currency: 'EUR',
          conditionHint: sample.conditionHint || undefined,
          timestamp: sample.createdAt.toISOString(),
          url: undefined
        });
      }
    }

    // If no samples, use default estimates
    if (samples.length === 0) {
      samples.push({
        source: 'MANUAL',
        price: 25,
        currency: 'EUR',
        conditionHint: 'Geschätzter Durchschnittspreis',
        timestamp: new Date().toISOString()
      });
    }

    // Call AI for pricing analysis
    const pricingResult: PricingAnalysisResult = await this.aiClient.analyzePricing({
      gameTitle: scan.confirmedTitle,
      edition: scan.confirmedEdition || undefined,
      condition: scan.confirmedCondition,
      language: scan.confirmedLanguage,
      isComplete: scan.isComplete ?? true,
      priceSamples: samples
    });

    // Update scan status
    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'PRICED' }
    });

    return {
      scanId,
      ...pricingResult,
      samples
    };
  }

  async generateDraft(scanId: string, input: DraftInput): Promise<DraftResult> {
    const scan = await this.getScan(scanId);

    if (!scan.confirmedTitle || !scan.confirmedCondition || !scan.confirmedLanguage) {
      throw new AppError(
        ErrorCodes.SCAN_NOT_READY,
        'Scan must be confirmed before generating draft',
        400
      );
    }

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'DRAFTING' }
    });

    // Call AI for listing generation
    const listingResult: ListingGenerationResult = await this.aiClient.generateListing({
      gameTitle: scan.confirmedTitle,
      edition: scan.confirmedEdition || undefined,
      condition: scan.confirmedCondition,
      language: scan.confirmedLanguage,
      isComplete: scan.isComplete ?? true,
      price: input.price,
      pickupLocation: input.pickupLocation,
      shippingAvailable: input.shippingAvailable,
      paypalAvailable: input.paypalAvailable,
      additionalNotes: input.additionalNotes
    });

    // Get or calculate pricing info
    let suggestedPrice = input.price;

    // Create or update listing draft
    await prisma.listingDraft.upsert({
      where: { scanId },
      create: {
        scanId,
        suggestedPrice,
        quickSalePrice: suggestedPrice * 0.8,
        negotiationAnchor: suggestedPrice * 1.15,
        rangeLow: suggestedPrice * 0.7,
        rangeHigh: suggestedPrice * 1.3,
        reasoningBullets: [],
        priceConfidence: 70,
        titleVariants: listingResult.titleVariants as unknown as Prisma.InputJsonValue,
        description: listingResult.description,
        bulletPoints: listingResult.bulletPoints,
        searchTags: listingResult.searchTags,
        pickupLocation: input.pickupLocation,
        shippingAvailable: input.shippingAvailable,
        paypalAvailable: input.paypalAvailable
      },
      update: {
        suggestedPrice,
        titleVariants: listingResult.titleVariants as unknown as Prisma.InputJsonValue,
        description: listingResult.description,
        bulletPoints: listingResult.bulletPoints,
        searchTags: listingResult.searchTags,
        pickupLocation: input.pickupLocation,
        shippingAvailable: input.shippingAvailable,
        paypalAvailable: input.paypalAvailable
      }
    });

    await prisma.scan.update({
      where: { id: scanId },
      data: { status: 'DRAFTED' }
    });

    return {
      scanId,
      titleVariants: listingResult.titleVariants,
      description: listingResult.description,
      bulletPoints: listingResult.bulletPoints,
      searchTags: listingResult.searchTags,
      suggestedPrice,
      metadata: {
        gameTitle: scan.confirmedTitle,
        condition: scan.confirmedCondition,
        language: scan.confirmedLanguage,
        isComplete: scan.isComplete ?? true
      }
    };
  }
}

// Singleton instance
export const scanService = new ScanService();
