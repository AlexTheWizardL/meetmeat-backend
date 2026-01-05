import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AI_PROVIDER } from './ai.interface';
import { OpenAiClient } from './providers/openai-client';
import { EventParser } from './providers/event-parser';
import { ImageGenerator } from './providers/image-generator';
import { OpenAiProvider } from './providers/openai.provider';
import { AiService } from './ai.service';
import { ScreenshotService } from './services/screenshot.service';
import { HtmlScraperService } from './services/html-scraper.service';

@Global()
@Module({})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AiModule {
  static forRoot(): DynamicModule {
    return {
      module: AiModule,
      imports: [ConfigModule],
      providers: [
        ScreenshotService,
        HtmlScraperService,
        OpenAiClient,
        EventParser,
        ImageGenerator,
        {
          provide: AI_PROVIDER,
          useClass: OpenAiProvider,
        },
        AiService,
      ],
      exports: [AI_PROVIDER, AiService, ScreenshotService, HtmlScraperService],
    };
  }
}
