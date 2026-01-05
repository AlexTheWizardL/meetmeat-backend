import { Injectable, Logger } from '@nestjs/common';
import type { ParsedEventData, BrandColors } from '../ai.interface';
import { eventParsingTemplate } from '../templates';
import { MockDataGenerator } from '../mock';
import {
  AiServiceUnavailableException,
  AiConfigurationException,
  AiRateLimitException,
  EventParsingException,
} from '../../../common/exceptions/app.exceptions';
import { ScreenshotService } from '../services/screenshot.service';
import {
  HtmlScraperService,
  type ScrapedData,
} from '../services/html-scraper.service';
import { OpenAiClient } from './openai-client';

@Injectable()
export class EventParser {
  private readonly logger = new Logger(EventParser.name);

  constructor(
    private readonly openAiClient: OpenAiClient,
    private readonly screenshotService: ScreenshotService,
    private readonly htmlScraperService: HtmlScraperService,
  ) {}

  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.log(`Parsing event from URL: ${url}`);

    if (!this.openAiClient.isConfigured) {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateEventData(url);
    }

    try {
      const { screenshot, html } = await this.screenshotService.capture(url);
      const scrapedData = this.htmlScraperService.scrape(html, url);

      this.logger.log(
        `Scraped: title="${scrapedData.title ?? 'unknown'}", colors=${String(scrapedData.colors.length)}, fonts=${String(scrapedData.fontFamilies.length)}`,
      );

      const prompt = eventParsingTemplate.buildVisionPrompt({
        url,
        scrapedData: {
          title: scrapedData.title,
          description: scrapedData.description,
          logoUrl: scrapedData.logoUrl,
          ogImage: scrapedData.ogImage,
          colors: scrapedData.colors,
          fontFamilies: scrapedData.fontFamilies,
        },
      });

      const response = await this.openAiClient.callVision(
        prompt,
        screenshot.toString('base64'),
      );

      const parsed = eventParsingTemplate.parse(response);
      return this.mergeEventData(parsed, scrapedData);
    } catch (error) {
      this.logger.error(`Failed to parse event from URL: ${url}`, error);

      if (
        !(error instanceof AiServiceUnavailableException) &&
        !(error instanceof AiConfigurationException) &&
        !(error instanceof AiRateLimitException)
      ) {
        this.logger.warn('Vision parsing failed, falling back to text-only');
        return this.parseEventTextOnly(url);
      }

      throw error;
    }
  }

  private async parseEventTextOnly(url: string): Promise<ParsedEventData> {
    try {
      const prompt = eventParsingTemplate.build({ url });
      const response = await this.openAiClient.callText(prompt, 'json_object');
      return eventParsingTemplate.parse(response);
    } catch (error) {
      this.logger.error('Text-only parsing also failed', error);
      if (
        error instanceof AiServiceUnavailableException ||
        error instanceof AiConfigurationException ||
        error instanceof AiRateLimitException
      ) {
        throw error;
      }
      throw new EventParsingException();
    }
  }

  private mergeEventData(
    aiData: ParsedEventData,
    scrapedData: ScrapedData,
  ): ParsedEventData {
    let brandColors: BrandColors | undefined = aiData.brandColors;

    if (brandColors === undefined && scrapedData.colors.length > 0) {
      brandColors = this.htmlScraperService.toBrandColors(scrapedData.colors);
    }

    return {
      ...aiData,
      logoUrl: scrapedData.logoUrl ?? aiData.logoUrl,
      heroImageUrl: aiData.heroImageUrl ?? scrapedData.ogImage,
      brandColors,
    };
  }
}
