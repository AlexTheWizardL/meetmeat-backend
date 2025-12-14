import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import { LocalStorageProvider } from '../providers/local.provider';

// Mock fs/promises
jest.mock('fs/promises');

describe('LocalStorageProvider', () => {
  let provider: LocalStorageProvider;
  let _configService: jest.Mocked<ConfigService>;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    mockConfigService.get.mockReturnValue('./test-uploads');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStorageProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    provider = module.get<LocalStorageProvider>(LocalStorageProvider);
    _configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize provider without error', () => {
      expect(provider).toBeDefined();
    });

    it('should use default path when not configured', async () => {
      const newMockConfig = { get: jest.fn().mockReturnValue(undefined) };

      const module = await Test.createTestingModule({
        providers: [
          LocalStorageProvider,
          {
            provide: ConfigService,
            useValue: newMockConfig,
          },
        ],
      }).compile();

      // Provider should still initialize without error
      expect(module.get(LocalStorageProvider)).toBeDefined();
    });
  });

  describe('upload', () => {
    const testBuffer = Buffer.from('test file content');
    const mockFs = fs as jest.Mocked<typeof fs>;

    beforeEach(() => {
      mockFs.mkdir.mockResolvedValue(undefined);
      mockFs.writeFile.mockResolvedValue(undefined);
    });

    it('should upload file with generated UUID filename', async () => {
      const result = await provider.upload(testBuffer, {
        mimeType: 'image/png',
      });

      expect(result.url).toMatch(/^\/uploads\/.+\.png$/);
      expect(result.size).toBe(testBuffer.length);
      expect(result.mimeType).toBe('image/png');
    });

    it('should upload file with custom filename', async () => {
      const result = await provider.upload(testBuffer, {
        filename: 'custom-name.jpg',
        mimeType: 'image/jpeg',
      });

      expect(result.key).toBe('custom-name.jpg');
      expect(result.url).toBe('/uploads/custom-name.jpg');
    });

    it('should create folder structure for nested paths', async () => {
      await provider.upload(testBuffer, {
        folder: 'posters/123/exports',
        filename: 'image.png',
        mimeType: 'image/png',
      });

      expect(mockFs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('posters'),
        { recursive: true },
      );
    });

    it('should handle folder option', async () => {
      const result = await provider.upload(testBuffer, {
        folder: 'avatars',
        filename: 'photo.jpg',
        mimeType: 'image/jpeg',
      });

      expect(result.key).toBe('avatars/photo.jpg');
      expect(result.url).toBe('/uploads/avatars/photo.jpg');
    });

    it('should use default mime type when not specified', async () => {
      const result = await provider.upload(testBuffer, {});

      expect(result.mimeType).toBe('application/octet-stream');
    });

    it('should detect extension from mime type', async () => {
      const pngResult = await provider.upload(testBuffer, {
        mimeType: 'image/png',
      });
      expect(pngResult.key).toMatch(/\.png$/);

      const jpgResult = await provider.upload(testBuffer, {
        mimeType: 'image/jpeg',
      });
      expect(jpgResult.key).toMatch(/\.jpg$/);

      const gifResult = await provider.upload(testBuffer, {
        mimeType: 'image/gif',
      });
      expect(gifResult.key).toMatch(/\.gif$/);

      const webpResult = await provider.upload(testBuffer, {
        mimeType: 'image/webp',
      });
      expect(webpResult.key).toMatch(/\.webp$/);
    });

    it('should write file to disk', async () => {
      await provider.upload(testBuffer, {
        filename: 'test.png',
        mimeType: 'image/png',
      });

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test.png'),
        testBuffer,
      );
    });
  });

  describe('delete', () => {
    const mockFs = fs as jest.Mocked<typeof fs>;

    it('should delete file from disk', async () => {
      mockFs.unlink.mockResolvedValue(undefined);

      await provider.delete('test-file.png');

      expect(mockFs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('test-file.png'),
      );
    });

    it('should handle non-existent file gracefully', async () => {
      mockFs.unlink.mockRejectedValue(new Error('ENOENT'));

      // Should not throw
      await expect(provider.delete('non-existent.png')).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    const mockFs = fs as jest.Mocked<typeof fs>;

    it('should return true when file exists', async () => {
      mockFs.access.mockResolvedValue(undefined);

      const result = await provider.exists('existing-file.png');

      expect(result).toBe(true);
    });

    it('should return false when file does not exist', async () => {
      mockFs.access.mockRejectedValue(new Error('ENOENT'));

      const result = await provider.exists('non-existent.png');

      expect(result).toBe(false);
    });
  });
});
