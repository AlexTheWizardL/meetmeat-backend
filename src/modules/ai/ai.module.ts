import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AI_PROVIDER } from './ai.interface';
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
        {
          provide: AI_PROVIDER,
          useFactory: (
            configService: ConfigService,
            screenshotService: ScreenshotService,
            htmlScraperService: HtmlScraperService,
          ) =>
            new OpenAiProvider(
              configService,
              screenshotService,
              htmlScraperService,
            ),
          inject: [ConfigService, ScreenshotService, HtmlScraperService],
        },
        AiService,
      ],
      exports: [AI_PROVIDER, AiService, ScreenshotService, HtmlScraperService],
    };
  }
}
