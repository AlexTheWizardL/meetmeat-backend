import { Injectable, Inject } from '@nestjs/common';
import type { AiProviderInterface } from './ai.interface';
import { AI_PROVIDER } from './ai.interface';
import type { ParsedEventData, GeneratedTemplate } from './ai.interface';

/**
 * AI Service
 *
 * This service acts as a facade over the AI provider.
 * Controllers use this service, which delegates to the configured provider.
 * The actual provider (OpenAI/Anthropic) is injected at runtime based on config.
 */
@Injectable()
export class AiService {
  constructor(
    @Inject(AI_PROVIDER)
    private readonly aiProvider: AiProviderInterface,
  ) {}

  /**
   * Parse event information from a URL
   */
  async parseEventFromUrl(url: string): Promise<ParsedEventData> {
    return this.aiProvider.parseEventFromUrl(url);
  }

  /**
   * Generate poster templates based on event data
   */
  async generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    return this.aiProvider.generateTemplates(eventData, count);
  }

  /**
   * Generate a background image for a poster using AI image generation
   */
  async generateBackgroundImage(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): Promise<string> {
    return this.aiProvider.generateBackgroundImage(eventData, style);
  }
}
