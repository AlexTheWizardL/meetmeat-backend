import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { STORAGE_PROVIDER } from './storage.interface';
import { LocalStorageProvider } from './providers/local.provider';
import { S3StorageProvider } from './providers/s3.provider';
import { StorageService } from './storage.service';

/**
 * Storage Module with swappable providers
 *
 * The provider is selected based on STORAGE_PROVIDER env variable.
 * Supports: local, s3, gcs (add more as needed)
 */
@Global()
@Module({})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class StorageModule {
  static forRoot(): DynamicModule {
    return {
      module: StorageModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: STORAGE_PROVIDER,
          useFactory: (configService: ConfigService) => {
            const provider = configService.get<string>('storage.provider');

            switch (provider) {
              case 's3':
                return new S3StorageProvider(configService);
              case 'gcs':
                // TODO: Implement GCS provider when needed
                throw new Error('GCS provider not yet implemented');
              case 'local':
              default:
                return new LocalStorageProvider(configService);
            }
          },
          inject: [ConfigService],
        },
        StorageService,
      ],
      exports: [STORAGE_PROVIDER, StorageService],
    };
  }
}
