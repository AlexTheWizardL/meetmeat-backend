import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuid } from 'uuid';
import {
  StorageProviderInterface,
  UploadedFile,
  UploadOptions,
} from '../storage.interface';

@Injectable()
export class S3StorageProvider implements StorageProviderInterface {
  private readonly logger = new Logger(S3StorageProvider.name);
  private readonly bucket: string;
  private readonly region: string;
  private readonly s3Client: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.bucket = this.configService.get<string>('storage.s3.bucket') || '';
    this.region =
      this.configService.get<string>('storage.s3.region') || 'us-east-1';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId:
          this.configService.get<string>('storage.s3.accessKeyId') || '',
        secretAccessKey:
          this.configService.get<string>('storage.s3.secretAccessKey') || '',
      },
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadedFile> {
    const folder = options.folder || '';
    const extension = this.getExtension(options.mimeType || '');
    const filename = options.filename || `${uuid()}${extension}`;
    const key = folder ? `${folder}/${filename}` : filename;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.mimeType,
      ACL: options.public ? 'public-read' : 'private',
    });

    await this.s3Client.send(command);

    this.logger.log(`File uploaded to S3: ${key}`);

    return {
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      key,
      bucket: this.bucket,
      size: buffer.length,
      mimeType: options.mimeType || 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
    this.logger.log(`File deleted from S3: ${key}`);
  }

  async getSignedUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      await this.s3Client.send(command);
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
