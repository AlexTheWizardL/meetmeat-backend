import { Injectable } from '@nestjs/common';
import type {
  AiProviderInterface,
  ParsedEventData,
  GeneratedTemplate,
} from '../ai.interface';
import { EventParser } from './event-parser';
import { ImageGenerator } from './image-generator';

@Injectable()
export class OpenAiProvider implements AiProviderInterface {
  constructor(
    private readonly eventParser: EventParser,
    private readonly imageGenerator: ImageGenerator,
  ) {}

  parseEventFromUrl(url: string): Promise<ParsedEventData> {
    return this.eventParser.parseEventFromUrl(url);
  }

  generateTemplates(
    eventData: ParsedEventData,
    count = 3,
  ): Promise<GeneratedTemplate[]> {
    return this.imageGenerator.generateTemplates(eventData, count);
  }

  generateBackgroundImage(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): Promise<string> {
    return this.imageGenerator.generateBackgroundImage(eventData, style);
  }
}
