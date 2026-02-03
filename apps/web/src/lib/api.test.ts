import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn()
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

// Mock crypto
Object.defineProperty(window, 'crypto', {
  value: {
    randomUUID: () => 'test-session-id'
  }
});

// Import after mocks
import { api } from './api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('existing-session');
  });

  describe('uploadScan', () => {
    it('should upload file and return scan id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scanId: 'new-scan-id', status: 'UPLOADED' })
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await api.uploadScan(file);

      expect(result.scanId).toBe('new-scan-id');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/scans'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    it('should include session id header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ scanId: 'test', status: 'UPLOADED' })
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      await api.uploadScan(file);

      const call = mockFetch.mock.calls[0];
      expect(call[1].headers['X-Session-Id']).toBeDefined();
    });

    it('should throw on error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: { message: 'Upload failed' } })
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      await expect(api.uploadScan(file)).rejects.toThrow('Upload failed');
    });
  });

  describe('getScan', () => {
    it('should fetch scan by id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'scan-id',
          status: 'ANALYZED',
          candidates: []
        })
      });

      const result = await api.getScan('scan-id');

      expect(result.id).toBe('scan-id');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/scans/scan-id'),
        expect.any(Object)
      );
    });
  });

  describe('confirmScan', () => {
    it('should send confirm request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'scan-id',
          normalizedTitle: 'Catan',
          keywords: ['catan'],
          status: 'ANALYZED'
        })
      });

      const result = await api.confirmScan('scan-id', {
        title: 'Catan',
        language: 'DE',
        condition: 'GOOD',
        isComplete: true
      });

      expect(result.normalizedTitle).toBe('Catan');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/scans/scan-id/confirm'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('Catan')
        })
      );
    });
  });

  describe('getPricing', () => {
    it('should fetch pricing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'scan-id',
          recommendedPrice: 25,
          quickSalePrice: 20,
          negotiationAnchor: 30,
          rangeLow: 18,
          rangeHigh: 35,
          samples: [],
          reasoningBullets: [],
          confidence: 80
        })
      });

      const result = await api.getPricing('scan-id');

      expect(result.recommendedPrice).toBe(25);
    });

    it('should send manual prices if provided', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'scan-id',
          recommendedPrice: 25,
          quickSalePrice: 20,
          negotiationAnchor: 30,
          rangeLow: 18,
          rangeHigh: 35,
          samples: [],
          reasoningBullets: [],
          confidence: 80
        })
      });

      await api.getPricing('scan-id', {
        manualPrices: { prices: [{ price: 25 }] }
      });

      const call = mockFetch.mock.calls[0];
      expect(call[1].body).toContain('manualPrices');
    });
  });

  describe('generateDraft', () => {
    it('should generate draft', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          scanId: 'scan-id',
          titleVariants: [],
          description: 'Test',
          bulletPoints: [],
          searchTags: [],
          suggestedPrice: 25,
          metadata: {}
        })
      });

      const result = await api.generateDraft('scan-id', {
        price: 25,
        shippingAvailable: true,
        paypalAvailable: true
      });

      expect(result.suggestedPrice).toBe(25);
    });
  });

  describe('pollScanStatus', () => {
    it('should poll until target status reached', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'id', status: 'ANALYZING' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: 'id', status: 'ANALYZED' })
        });

      const result = await api.pollScanStatus('id', ['ANALYZED'], 10, 10);

      expect(result.status).toBe('ANALYZED');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should return on error status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'id', status: 'ERROR', error: 'Failed' })
      });

      const result = await api.pollScanStatus('id', ['ANALYZED'], 10, 10);

      expect(result.status).toBe('ERROR');
    });

    it('should throw on timeout', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'id', status: 'ANALYZING' })
      });

      await expect(
        api.pollScanStatus('id', ['ANALYZED'], 2, 10)
      ).rejects.toThrow('Polling timeout');
    });
  });
});
