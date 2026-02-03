import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FileService } from './file.service';
import { ErrorCodes } from '@i2k/shared';

// Mock fs and sharp
vi.mock('fs', () => ({
  createWriteStream: vi.fn(() => ({
    on: vi.fn((event, cb) => {
      if (event === 'finish') setTimeout(cb, 0);
      return { on: vi.fn() };
    })
  })),
  existsSync: vi.fn(() => true),
  mkdirSync: vi.fn(),
  unlinkSync: vi.fn(),
  readFileSync: vi.fn(() => Buffer.from('test-image-data'))
}));

vi.mock('stream/promises', () => ({
  pipeline: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('sharp', () => {
  const mockSharp = vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 1920, height: 1080, size: 1024 }),
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined)
  }));
  return { default: mockSharp };
});

describe('FileService', () => {
  let service: FileService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FileService();
  });

  describe('validateMimeType', () => {
    it('should accept valid image types', () => {
      expect(() => service.validateMimeType('image/jpeg')).not.toThrow();
      expect(() => service.validateMimeType('image/png')).not.toThrow();
      expect(() => service.validateMimeType('image/webp')).not.toThrow();
    });

    it('should reject invalid types', () => {
      expect(() => service.validateMimeType('image/gif')).toThrow();
      expect(() => service.validateMimeType('application/pdf')).toThrow();
      expect(() => service.validateMimeType('text/plain')).toThrow();
    });

    it('should throw AppError with correct code', () => {
      try {
        service.validateMimeType('image/gif');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.INVALID_FILE_TYPE);
        expect(error.statusCode).toBe(400);
      }
    });
  });

  describe('getFilePath', () => {
    it('should return full path for key', () => {
      const path = service.getFilePath('test-file.jpg');
      expect(path).toContain('test-file.jpg');
    });
  });

  describe('getFileAsBase64', () => {
    it('should return base64 encoded file', async () => {
      const result = await service.getFileAsBase64('test.jpg');
      expect(typeof result).toBe('string');
    });

    it('should throw NOT_FOUND for missing file', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValueOnce(false);

      try {
        await service.getFileAsBase64('missing.jpg');
        expect.fail('Should have thrown');
      } catch (error: any) {
        expect(error.code).toBe(ErrorCodes.NOT_FOUND);
      }
    });
  });

  describe('deleteFile', () => {
    it('should delete existing file', async () => {
      const fs = await import('fs');
      await service.deleteFile('test.jpg');
      expect(fs.unlinkSync).toHaveBeenCalled();
    });

    it('should not throw for non-existing file', async () => {
      const fs = await import('fs');
      vi.mocked(fs.existsSync).mockReturnValueOnce(false);

      await expect(service.deleteFile('missing.jpg')).resolves.not.toThrow();
    });
  });
});
