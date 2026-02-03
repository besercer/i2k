import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScanService } from './scan.service';
import { ErrorCodes } from '@i2k/shared';
import { prisma } from '@i2k/database';

// Mock file service
vi.mock('./file.service', () => ({
  fileService: {
    saveUpload: vi.fn().mockResolvedValue({
      key: 'test-key.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      path: '/uploads/test-key.jpg'
    }),
    getFileAsBase64: vi.fn().mockResolvedValue('base64-image-data'),
    deleteFile: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock AI client
vi.mock('@i2k/ai-client', () => ({
  createAiClient: vi.fn(() => ({
    recognizeGame: vi.fn().mockResolvedValue({
      best: { title: 'Catan', confidence: 90 },
      alternatives: [],
      evidence: { visibleText: [], visualCues: [] },
      needsConfirmation: false
    }),
    normalizeTitle: vi.fn().mockResolvedValue({
      normalizedTitle: 'Die Siedler von Catan',
      keywords: ['catan', 'siedler']
    }),
    analyzePricing: vi.fn().mockResolvedValue({
      recommendedPrice: 25,
      quickSalePrice: 20,
      negotiationAnchor: 30,
      rangeLow: 18,
      rangeHigh: 35,
      reasoningBullets: ['Test'],
      confidence: 80
    }),
    generateListing: vi.fn().mockResolvedValue({
      titleVariants: [
        { title: 'Test 1', style: 'NEUTRAL' },
        { title: 'Test 2', style: 'URGENT' },
        { title: 'Test 3', style: 'FRIENDLY' }
      ],
      description: 'Test description',
      bulletPoints: ['1', '2', '3', '4', '5'],
      searchTags: ['a', 'b', 'c', 'd', 'e']
    })
  }))
}));

describe('ScanService', () => {
  let service: ScanService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ScanService();
  });

  describe('createScan', () => {
    it('should create a new scan', async () => {
      const mockScan = {
        id: 'test-scan-id',
        status: 'UPLOADED',
        imageKey: 'test-key.jpg'
      };
      vi.mocked(prisma.scan.create).mockResolvedValue(mockScan as any);

      const mockStream = {} as NodeJS.ReadableStream;
      const result = await service.createScan(
        mockStream,
        'image/jpeg',
        'test.jpg',
        'session-123'
      );

      expect(result.scanId).toBe('test-scan-id');
      expect(result.status).toBe('UPLOADED');
      expect(prisma.scan.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'UPLOADED',
            sessionId: 'session-123'
          })
        })
      );
    });
  });

  describe('getScan', () => {
    it('should return scan with relations', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'ANALYZED',
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);

      const result = await service.getScan('test-id');

      expect(result.id).toBe('test-id');
      expect(prisma.scan.findUnique).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        include: { priceSamples: true, listingDraft: true }
      });
    });

    it('should throw NOT_FOUND for missing scan', async () => {
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(null);

      try {
        await service.getScan('missing-id');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      }
    });
  });

  describe('confirmScan', () => {
    it('should confirm scan with valid data', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'ANALYZED',
        aiCandidates: [{ title: 'Original' }],
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);
      vi.mocked(prisma.scan.update).mockResolvedValue({ ...mockScan } as any);

      const result = await service.confirmScan('test-id', {
        title: 'Catan',
        language: 'DE',
        condition: 'GOOD',
        isComplete: true
      });

      expect(result.normalizedTitle).toBeDefined();
      expect(result.keywords).toBeInstanceOf(Array);
    });

    it('should throw SCAN_NOT_READY for non-analyzed scan', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'UPLOADED',
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);

      try {
        await service.confirmScan('test-id', {
          title: 'Test',
          language: 'DE',
          condition: 'GOOD',
          isComplete: true
        });
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.SCAN_NOT_READY);
      }
    });
  });

  describe('calculatePricing', () => {
    it('should calculate pricing with manual prices', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'ANALYZED',
        confirmedTitle: 'Catan',
        confirmedCondition: 'GOOD',
        confirmedLanguage: 'DE',
        isComplete: true,
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);
      vi.mocked(prisma.scan.update).mockResolvedValue(mockScan as any);
      vi.mocked(prisma.priceSample.create).mockResolvedValue({
        id: 'sample-id',
        price: 25,
        source: 'MANUAL',
        createdAt: new Date()
      } as any);

      const result = await service.calculatePricing('test-id', {
        manualPrices: [{ price: 25, conditionHint: 'Good' }]
      });

      expect(result.recommendedPrice).toBeGreaterThan(0);
      expect(result.samples.length).toBeGreaterThan(0);
    });

    it('should throw for unconfirmed scan', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'ANALYZED',
        confirmedTitle: null,
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);

      try {
        await service.calculatePricing('test-id', {});
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.SCAN_NOT_READY);
      }
    });
  });

  describe('generateDraft', () => {
    it('should generate listing draft', async () => {
      const mockScan = {
        id: 'test-id',
        status: 'PRICED',
        confirmedTitle: 'Catan',
        confirmedEdition: null,
        confirmedCondition: 'GOOD',
        confirmedLanguage: 'DE',
        isComplete: true,
        priceSamples: [],
        listingDraft: null
      };
      vi.mocked(prisma.scan.findUnique).mockResolvedValue(mockScan as any);
      vi.mocked(prisma.scan.update).mockResolvedValue(mockScan as any);
      vi.mocked(prisma.listingDraft.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.listingDraft.upsert).mockResolvedValue({} as any);

      const result = await service.generateDraft('test-id', {
        price: 25,
        shippingAvailable: true,
        paypalAvailable: true
      });

      expect(result.titleVariants).toHaveLength(3);
      expect(result.description).toBeDefined();
      expect(result.bulletPoints).toHaveLength(5);
    });
  });
});
