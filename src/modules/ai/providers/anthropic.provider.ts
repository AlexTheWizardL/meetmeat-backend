import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
} from '../ai.interface';
import { MockDataGenerator } from '../mock';
import type { ScreenshotService } from '../services/screenshot.service';
import type { HtmlScraperService } from '../services/html-scraper.service';

/**
 * Anthropic Provider - Currently returns mock data
 * TODO: Implement Claude Vision when needed
 */
@Injectable()
export class AnthropicProvider implements AiProviderInterface {
  private readonly logger = new Logger(AnthropicProvider.name);

  constructor(
    private readonly _configService: ConfigService,
    private readonly _screenshotService: ScreenshotService,
    private readonly _htmlScraperService: HtmlScraperService,
  ) {}

  parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.warn('Anthropic provider not implemented, returning mock data');
    return Promise.resolve(MockDataGenerator.generateEventData(url));
  }

  generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    this.logger.warn('Anthropic provider not implemented, returning mock data');
    return Promise.resolve(
      MockDataGenerator.generateTemplates(eventData, count),
    );
  }
}
