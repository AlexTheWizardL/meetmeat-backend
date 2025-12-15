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

interface OpenAiResponse {
  choices: { message: { content: string } }[];
}

@Injectable()
export class OpenAiProvider implements AiProviderInterface {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.openai.apiKey') ?? '';
    this.model =
      this.configService.get<string>('ai.openai.model') ??
      'gpt-4-turbo-preview';
  }

  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.log(`Parsing event from URL: ${url}`);

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateEventData(url);
    }

    try {
      const prompt = eventParsingTemplate.build({ url });
      const response = await this.callOpenAI(prompt, 'json_object');
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

          // Map HTTP status codes to user-friendly exceptions
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
