import { Injectable, Logger } from '@nestjs/common';
import type { ParsedEventData, GeneratedTemplate } from '../ai.interface';
import { templateGenerationTemplate } from '../templates';
import { MockDataGenerator } from '../mock';
import {
  AiServiceUnavailableException,
  AiConfigurationException,
  AiRateLimitException,
  TemplateGenerationException,
} from '../../../common/exceptions/app.exceptions';
import { OpenAiClient } from './openai-client';

@Injectable()
export class ImageGenerator {
  private readonly logger = new Logger(ImageGenerator.name);

  constructor(private readonly openAiClient: OpenAiClient) {}

  async generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    this.logger.log(
      `Generating ${String(count)} templates for event: ${eventData.name}`,
    );

    if (!this.openAiClient.isConfigured) {
      this.logger.warn('OpenAI API key not configured, returning mock data');
      return MockDataGenerator.generateTemplates(eventData, count);
    }

    try {
      const prompt = templateGenerationTemplate.build({ eventData, count });
      const response = await this.openAiClient.callText(prompt, 'json_object');
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

  async generateBackgroundImage(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): Promise<string> {
    this.logger.log(
      `Generating ${style} background image for event: ${eventData.name}`,
    );

    if (!this.openAiClient.isConfigured) {
      this.logger.warn('OpenAI API key not configured, returning placeholder');
      return this.buildPlaceholderUrl(eventData);
    }

    const prompt = this.buildBackgroundPrompt(eventData, style);

    try {
      return await this.openAiClient.callDalle(prompt);
    } catch (error) {
      this.logger.error(
        `Failed to generate background for event: ${eventData.name}`,
        error,
      );
      return this.buildPlaceholderUrl(eventData);
    }
  }

  private buildPlaceholderUrl(eventData: ParsedEventData): string {
    const primary = (eventData.brandColors?.primary ?? '#6C5CE7').replace(
      '#',
      '',
    );
    const secondary = (eventData.brandColors?.secondary ?? '#A29BFE').replace(
      '#',
      '',
    );
    return `https://placehold.co/1080x1350/${primary}/${secondary}?text=`;
  }

  private buildBackgroundPrompt(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): string {
    const primaryColor = eventData.brandColors?.primary ?? '#6C5CE7';
    const secondaryColor = eventData.brandColors?.secondary ?? primaryColor;
    const eventName = eventData.name;
    const eventDescription = eventData.description ?? '';

    const eventContext = `${eventName} ${eventDescription}`.toLowerCase();
    const themeHint = this.detectTheme(eventContext);
    const styleDesc = this.getStyleDescription(style);

    return `Create a full-bleed abstract background for "${eventName}" event poster.

EVENT THEME: ${themeHint}

COLOR PALETTE (MUST USE):
- PRIMARY: ${primaryColor} (dominant, 60-70%)
- SECONDARY: ${secondaryColor} (accent, 20-30%)

VISUAL STYLE: ${styleDesc}

REQUIREMENTS:
- Abstract design inspired by the event theme - evoke the spirit of ${themeHint}
- FULL BLEED: extends to ALL edges, NO borders, NO frames, NO margins
- NO text, NO logos, NO people, NO faces
- Vertical/portrait orientation
- Slightly lighter/softer area in center-bottom for text overlay
- Professional, high-end conference aesthetic
- Seamless edge-to-edge design`;
  }

  private detectTheme(eventContext: string): string {
    const themes: { keywords: string[]; theme: string }[] = [
      {
        keywords: ['ai', 'artificial intelligence', 'machine learning'],
        theme:
          'AI and machine learning technology, neural networks, data flows',
      },
      {
        keywords: ['web', 'frontend', 'javascript'],
        theme: 'web development, digital interfaces, code aesthetics',
      },
      {
        keywords: ['startup', 'entrepreneur'],
        theme: 'innovation, growth, entrepreneurship, dynamic energy',
      },
      {
        keywords: ['design', 'ux', 'ui'],
        theme: 'design thinking, creative flow, user experience',
      },
      {
        keywords: ['devops', 'cloud', 'infrastructure'],
        theme: 'cloud computing, infrastructure, connected systems',
      },
      {
        keywords: ['data', 'analytics'],
        theme: 'data visualization, analytics, information flow',
      },
      {
        keywords: ['security', 'cyber'],
        theme: 'cybersecurity, digital protection, encrypted networks',
      },
      {
        keywords: ['mobile', 'app'],
        theme: 'mobile technology, app interfaces, connected devices',
      },
      {
        keywords: ['game', 'gaming'],
        theme: 'gaming, interactive entertainment, digital worlds',
      },
    ];

    for (const { keywords, theme } of themes) {
      if (keywords.some((kw) => eventContext.includes(kw))) {
        return theme;
      }
    }

    return 'professional technology conference';
  }

  private getStyleDescription(style: 'modern' | 'minimal' | 'bold'): string {
    const styles: Record<string, string> = {
      modern:
        'modern and sleek with smooth gradients, soft glows, and flowing organic shapes',
      minimal:
        'minimal and clean with subtle textures, fine lines, and elegant simplicity',
      bold: 'bold and vibrant with high contrast, strong geometric shapes, and dynamic energy',
    };
    return styles[style];
  }
}
