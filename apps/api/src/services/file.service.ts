import { createWriteStream, existsSync, mkdirSync, unlinkSync, readFileSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';
import sharp from 'sharp';
import { nanoid } from 'nanoid';
import { env } from '../config/env';
import { AppError } from '../plugins/error-handler';
import { ErrorCodes } from '@i2k/shared';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_DIMENSION = 2048;

export interface UploadedFile {
  key: string;
  mimeType: string;
  size: number;
  path: string;
}

export interface FileServiceInterface {
  saveUpload(
    fileStream: NodeJS.ReadableStream,
    mimeType: string,
    filename: string
  ): Promise<UploadedFile>;
  getFilePath(key: string): string;
  getFileAsBase64(key: string): Promise<string>;
  deleteFile(key: string): Promise<void>;
  validateMimeType(mimeType: string): void;
}

export class FileService implements FileServiceInterface {
  private uploadDir: string;

  constructor() {
    this.uploadDir = env.UPLOAD_DIR;
    this.ensureUploadDir();
  }

  private ensureUploadDir(): void {
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  validateMimeType(mimeType: string): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new AppError(
        ErrorCodes.INVALID_FILE_TYPE,
        `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        400
      );
    }
  }

  async saveUpload(
    fileStream: NodeJS.ReadableStream,
    mimeType: string,
    _filename: string
  ): Promise<UploadedFile> {
    this.validateMimeType(mimeType);

    const ext = this.getExtension(mimeType);
    const key = `${nanoid()}.${ext}`;
    const tempPath = join(this.uploadDir, `temp_${key}`);
    const finalPath = join(this.uploadDir, key);

    try {
      // Save to temp file first
      const writeStream = createWriteStream(tempPath);
      await pipeline(fileStream, writeStream);

      // Process with sharp: validate, resize, convert
      const image = sharp(tempPath);
      const metadata = await image.metadata();

      if (!metadata.width || !metadata.height) {
        throw new AppError(
          ErrorCodes.INVALID_FILE_TYPE,
          'Could not read image dimensions',
          400
        );
      }

      // Resize if needed, maintain aspect ratio
      let processedImage = image;
      if (metadata.width > MAX_DIMENSION || metadata.height > MAX_DIMENSION) {
        processedImage = image.resize(MAX_DIMENSION, MAX_DIMENSION, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Save as optimized JPEG for consistency
      await processedImage
        .jpeg({ quality: 85 })
        .toFile(finalPath);

      // Get final file stats
      const processedMetadata = await sharp(finalPath).metadata();

      // Clean up temp file
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }

      return {
        key,
        mimeType: 'image/jpeg',
        size: processedMetadata.size || 0,
        path: finalPath
      };
    } catch (error) {
      // Clean up on error
      if (existsSync(tempPath)) {
        unlinkSync(tempPath);
      }
      if (existsSync(finalPath)) {
        unlinkSync(finalPath);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        ErrorCodes.INTERNAL_ERROR,
        'Failed to process uploaded file',
        500
      );
    }
  }

  getFilePath(key: string): string {
    return join(this.uploadDir, key);
  }

  async getFileAsBase64(key: string): Promise<string> {
    const path = this.getFilePath(key);
    if (!existsSync(path)) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'File not found', 404);
    }

    const buffer = readFileSync(path);
    return buffer.toString('base64');
  }

  async deleteFile(key: string): Promise<void> {
    const path = this.getFilePath(key);
    if (existsSync(path)) {
      unlinkSync(path);
    }
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp'
    };
    return extensions[mimeType] || 'jpg';
  }
}

// Singleton instance
export const fileService = new FileService();
