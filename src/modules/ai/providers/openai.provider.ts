import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
  BrandColors,
} from '../ai.interface';
import { eventParsingTemplate, templateGenerationTemplate } from '../templates';
import { MockDataGenerator } from '../mock';
import { withRetry } from '../../../common/utils/retry';
import {
  AiServiceUnavailableException,
  AiConfigurationException,
  AiRateLimitException,
  EventParsingException,
  TemplateGenerationException,
} from '../../../common/exceptions/app.exceptions';
import { ScreenshotService } from '../services/screenshot.service';
import { HtmlScraperService } from '../services/html-scraper.service';

interface OpenAiResponse {
  choices: { message: { content: string } }[];
}

interface OpenAiMessage {
  role: 'user' | 'system' | 'assistant';
  content: string | OpenAiContentPart[];
}

interface OpenAiContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

@Injectable()
export class OpenAiProvider implements AiProviderInterface {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly visionModel: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly screenshotService: ScreenshotService,
    private readonly htmlScraperService: HtmlScraperService,
  ) {
    this.apiKey = this.configService.get<string>('ai.openai.apiKey') ?? '';
    this.model =
      this.configService.get<string>('ai.openai.model') ?? 'gpt-4-turbo';
    // Use GPT-4o for vision (has vision capabilities built-in)
    this.visionModel = 'gpt-4o';
  }

  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.log(`Parsing event from URL: ${url}`);

    if (this.apiKey === '') {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateEventData(url);
    }

    try {
      // Capture screenshot and HTML
      const { screenshot, html } = await this.screenshotService.capture(url);

      // Scrape HTML for exact values
      const scrapedData = this.htmlScraperService.scrape(html, url);

      this.logger.log(
        `Scraped: title="${scrapedData.title ?? 'unknown'}", colors=${String(scrapedData.colors.length)}, fonts=${String(scrapedData.fontFamilies.length)}`,
      );

      // Build vision prompt with scraped data
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

      // Call GPT-4 Vision with screenshot
      const response = await this.callOpenAIVision(
        prompt,
        screenshot.toString('base64'),
      );

      const parsed = eventParsingTemplate.parse(response);

      // Merge scraped data with AI analysis
      return this.mergeEventData(parsed, scrapedData);
    } catch (error) {
      this.logger.error(`Failed to parse event from URL: ${url}`, error);

      // If vision fails, fall back to text-only parsing
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

  /**
   * Fallback to text-only parsing if vision fails
   */
  private async parseEventTextOnly(url: string): Promise<ParsedEventData> {
    try {
      const prompt = eventParsingTemplate.build({ url });
      const response = await this.callOpenAI(prompt, 'json_object');
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

  /**
   * Merge AI-parsed data with HTML-scraped data
   */
  private mergeEventData(
    aiData: ParsedEventData,
    scrapedData: ReturnType<HtmlScraperService['scrape']>,
  ): ParsedEventData {
    // Start with AI-detected colors or empty
    let brandColors: BrandColors | undefined = aiData.brandColors;

    // If AI didn't detect colors but we scraped some, use scraped colors
    if (brandColors === undefined && scrapedData.colors.length > 0) {
      brandColors = this.htmlScraperService.toBrandColors(scrapedData.colors);
    }

    return {
      ...aiData,
      // Prefer scraped logo URL if available
      logoUrl: scrapedData.logoUrl ?? aiData.logoUrl,
      // Use OG image as hero image if not detected by AI
      heroImageUrl: aiData.heroImageUrl ?? scrapedData.ogImage,
      brandColors,
    };
  }

  async generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    this.logger.log(
      `Generating ${String(count)} templates for event: ${eventData.name}`,
    );

    if (this.apiKey === '') {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateTemplates(eventData, count);
    }

    try {
      const prompt = templateGenerationTemplate.build({ eventData, count });
      const response = await this.callOpenAI(prompt, 'json_object');
      const result = templateGenerationTemplate.parse(response);
      return result.templates.slice(0, count);
    } catch (error) {
      this.logger.error(
        `Failed to generate templates for event: ${eventData.name}`,
        error,
      );
      if (
        error instanceof AiServiceUnavailableException ||
        error instanceof AiConfigurationException ||
        error instanceof AiRateLimitException
      ) {
        throw error;
      }
      throw new TemplateGenerationException();
    }
  }

  /**
   * Call OpenAI with vision (GPT-4V)
   */
  private async callOpenAIVision(
    prompt: string,
    imageBase64: string,
  ): Promise<string> {
    return withRetry(
      async () => {
        const messages: OpenAiMessage[] = [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: 'low', // Use low detail to reduce cost
                },
              },
            ],
          },
        ];

        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.visionModel,
              messages,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `OpenAI Vision API error: ${String(response.status)} - ${errorText}`,
          );

          if (response.status === 401) {
            throw new AiConfigurationException();
          }
          if (response.status === 429) {
            throw new AiRateLimitException();
          }
          if (response.status >= 500) {
            throw new AiServiceUnavailableException(errorText);
          }
          throw new AiServiceUnavailableException(errorText);
        }

        const data = (await response.json()) as OpenAiResponse;
        return data.choices[0].message.content;
      },
      {
        maxRetries: 2,
        initialDelayMs: 1000,
        logger: this.logger,
        context: 'OpenAI Vision API',
      },
    );
  }

  /**
   * Call OpenAI text API
   */
  private async callOpenAI(
    prompt: string,
    responseFormat: 'json_object' | 'text' = 'text',
  ): Promise<string> {
    return withRetry(
      async () => {
        const response = await fetch(
          'https://api.openai.com/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
              model: this.model,
              messages: [{ role: 'user', content: prompt }],
              response_format:
                responseFormat === 'json_object'
                  ? { type: 'json_object' }
                  : undefined,
            }),
          },
        );

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `OpenAI API error: ${String(response.status)} - ${errorText}`,
          );

          if (response.status === 401) {
            throw new AiConfigurationException();
          }
          if (response.status === 429) {
            throw new AiRateLimitException();
          }
          if (response.status >= 500) {
            throw new AiServiceUnavailableException(errorText);
          }
          throw new AiServiceUnavailableException(errorText);
        }

        const data = (await response.json()) as OpenAiResponse;
        return data.choices[0].message.content;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        logger: this.logger,
        context: 'OpenAI API',
      },
    );
  }
}
