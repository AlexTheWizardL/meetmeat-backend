import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
} from '../ai.interface';
import { eventParsingTemplate, templateGenerationTemplate } from '../templates';
import { MockDataGenerator } from '../mock';

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

    const prompt = eventParsingTemplate.build({ url });
    const response = await this.callAnthropic(prompt);

    return eventParsingTemplate.parse(response);
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

    const prompt = templateGenerationTemplate.build({ eventData, count });
    const response = await this.callAnthropic(prompt);
    const result = templateGenerationTemplate.parse(response);

    return result.templates.slice(0, count);
  }

  private async callAnthropic(prompt: string): Promise<string> {
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
      const error = await response.text();
      throw new Error(
        `Anthropic API error: ${String(response.status)} - ${error}`,
      );
    }

    const data = (await response.json()) as AnthropicResponse;
    return data.content[0].text;
  }
}
