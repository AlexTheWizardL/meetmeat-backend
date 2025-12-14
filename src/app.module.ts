import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { DataSourceOptions } from 'typeorm';

import databaseConfig from './config/database.config';
import aiConfig from './config/ai.config';
import storageConfig from './config/storage.config';
import validationSchema from './config/validation';

import { ProfilesModule } from './modules/profiles/profiles.module';
import { EventsModule } from './modules/events/events.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { PostersModule } from './modules/posters/posters.module';
import { AiModule } from './modules/ai/ai.module';
import { StorageModule } from './modules/storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, aiConfig, storageConfig],
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): DataSourceOptions => {
        const dbConfig = configService.get<DataSourceOptions>('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
    }),

    AiModule.forRoot(),
    StorageModule.forRoot(),

    ProfilesModule,
    EventsModule,
    TemplatesModule,
    PostersModule,
  ],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
