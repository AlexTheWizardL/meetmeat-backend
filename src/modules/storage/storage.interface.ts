/**
 * Storage Provider Interface
 *
 * This is the abstract contract that all storage providers must implement.
 * Swap providers by changing STORAGE_PROVIDER env variable.
 */

export interface UploadedFile {
  url: string;
  key: string;
  bucket?: string;
  size: number;
  mimeType: string;
}

export interface UploadOptions {
  filename?: string;
  mimeType?: string;
  folder?: string;
  public?: boolean;
}

export interface StorageProviderInterface {
  /**
   * Upload a file buffer to storage
   */
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadedFile>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * Get a signed URL for temporary access (optional, for private files)
   */
  getSignedUrl?(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;
}

// Injection token for the storage provider
export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';
