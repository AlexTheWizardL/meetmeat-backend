import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
} from '../ai.interface';
import { eventParsingTemplate, templateGenerationTemplate } from '../templates';
import { MockDataGenerator } from '../mock';

interface OpenAiResponse {
  choices: { message: { content: string } }[];
}

@Injectable()
export class OpenAiProvider implements AiProviderInterface {
  private readonly logger = new Logger(OpenAiProvider.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ai.openai.apiKey') || '';
    this.model =
      this.configService.get<string>('ai.openai.model') ||
      'gpt-4-turbo-preview';
  }

  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    this.logger.log(`Parsing event from URL: ${url}`);

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateEventData(url);
    }

    const prompt = eventParsingTemplate.build({ url });
    const response = await this.callOpenAI(prompt, 'json_object');

    return eventParsingTemplate.parse(response);
  }

  async generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    this.logger.log(
      `Generating ${count} templates for event: ${eventData.name}`,
    );

    if (!this.apiKey) {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateTemplates(eventData, count);
    }

    const prompt = templateGenerationTemplate.build({ eventData, count });
    const response = await this.callOpenAI(prompt, 'json_object');
    const result = templateGenerationTemplate.parse(response);

    return result.templates.slice(0, count);
  }

  private async callOpenAI(
    prompt: string,
    responseFormat: 'json_object' | 'text' = 'text',
  ): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    return data.choices[0].message.content;
  }
}
