import { Injectable, Inject } from '@nestjs/common';
import { STORAGE_PROVIDER } from './storage.interface';
import type {
  StorageProviderInterface,
  UploadedFile,
  UploadOptions,
} from './storage.interface';

/**
 * Storage Service
 *
 * Facade over the storage provider.
 * Controllers use this service, which delegates to the configured provider.
 */
@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  /**
   * Upload a file
   */
  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadedFile> {
    return this.storageProvider.upload(buffer, options);
  }

  /**
   * Delete a file
   */
  async delete(key: string): Promise<void> {
    return this.storageProvider.delete(key);
  }

  /**
   * Get a signed URL for temporary access
   */
  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    if (this.storageProvider.getSignedUrl) {
      return this.storageProvider.getSignedUrl(key, expiresInSeconds);
    }
    throw new Error('Signed URLs not supported by this storage provider');
  }

  /**
   * Check if a file exists
   */
  async exists(key: string): Promise<boolean> {
    return this.storageProvider.exists(key);
  }
}
