import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import {
  StorageProviderInterface,
  UploadedFile,
  UploadOptions,
} from '../storage.interface';

@Injectable()
export class LocalStorageProvider implements StorageProviderInterface {
  private readonly logger = new Logger(LocalStorageProvider.name);
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath =
      this.configService.get<string>('storage.local.path') ?? './uploads';
    void this.ensureDirectory();
  }

  private async ensureDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.basePath, { recursive: true });
    } catch (error) {
      this.logger.error('Failed to create uploads directory', error);
    }
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadedFile> {
    const folder = options.folder ?? '';
    const extension = this.getExtension(options.mimeType ?? '');
    const filename = options.filename ?? `${uuid()}${extension}`;
    const key = folder !== '' ? `${folder}/${filename}` : filename;
    const fullPath = path.resolve(this.basePath, key);

    // Security: Prevent path traversal attacks
    const resolvedBase = path.resolve(this.basePath);
    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      throw new Error('Invalid path: path traversal detected');
    }

    // Ensure folder exists
    const folderPath = path.dirname(fullPath);
    await fs.mkdir(folderPath, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, buffer);

    this.logger.log(`File uploaded: ${key}`);

    return {
      url: `/uploads/${key}`,
      key,
      size: buffer.length,
      mimeType: options.mimeType ?? 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.resolve(this.basePath, key);
    const resolvedBase = path.resolve(this.basePath);
    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      throw new Error('Invalid path: path traversal detected');
    }

    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted: ${key}`);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        this.logger.warn(`File not found for deletion: ${key}`);
      } else {
        throw error;
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.resolve(this.basePath, key);
    const resolvedBase = path.resolve(this.basePath);
    if (!fullPath.startsWith(resolvedBase + path.sep)) {
      return false;
    }

    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  private getExtension(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/gif': '.gif',
      'image/webp': '.webp',
    };
    return extensions[mimeType] || '';
  }
}
