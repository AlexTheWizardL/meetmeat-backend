import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
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

interface AnthropicResponse {
  content: { text: string }[];
}

@Injectable()
export class AnthropicProvider implements AiProviderInterface {
  private readonly logger = new Logger(AnthropicProvider.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly apiVersion: string;
  private readonly maxTokens: number;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.anthropic.apiKey') ?? '';
    this.model =
      this.configService.get<string>('ai.anthropic.model') ??
      'claude-3-opus-20240229';
    this.apiVersion =
      this.configService.get<string>('ai.anthropic.apiVersion') ?? '2023-06-01';
    this.maxTokens =
      this.configService.get<number>('ai.anthropic.maxTokens') ?? 4096;
  }

  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.log(`Parsing event from URL: ${url}`);

    if (!this.apiKey) {
      this.logger.warn('Anthropic API key not configured, returning mock data');
      return MockDataGenerator.generateEventData(url);
    }

    try {
      const prompt = eventParsingTemplate.build({ url });
      const response = await this.callAnthropic(prompt);
      return eventParsingTemplate.parse(response);
    } catch (error) {
      this.logger.error(`Failed to parse event from URL: ${url}`, error);
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

  async generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    this.logger.log(
      `Generating ${String(count)} templates for event: ${eventData.name}`,
    );

    if (!this.apiKey) {
      this.logger.warn('Anthropic API key not configured, returning mock data');
      return MockDataGenerator.generateTemplates(eventData, count);
    }

    try {
      const prompt = templateGenerationTemplate.build({ eventData, count });
      const response = await this.callAnthropic(prompt);
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

  private async callAnthropic(prompt: string): Promise<string> {
    return withRetry(
      async () => {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': this.apiVersion,
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: this.maxTokens,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          this.logger.error(
            `Anthropic API error: ${String(response.status)} - ${errorText}`,
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

        const data = (await response.json()) as AnthropicResponse;
        return data.content[0].text;
      },
      {
        maxRetries: 3,
        initialDelayMs: 1000,
        logger: this.logger,
        context: 'Anthropic API',
      },
    );
  }
}
