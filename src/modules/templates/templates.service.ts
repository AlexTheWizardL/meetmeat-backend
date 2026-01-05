import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Template } from './entities/template.entity';
import { AiService } from '../ai/ai.service';
import { EventsService } from '../events/events.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly aiService: AiService,
    private readonly eventsService: EventsService,
  ) {}

  async generateForEvent(eventId: string, count = 3): Promise<Template[]> {
    const event = await this.eventsService.findOne(eventId);

    // Generate templates using AI
    // Handle both Date objects and ISO strings for dates
    const formatDate = (
      date: Date | string | undefined,
    ): string | undefined => {
      if (date === undefined) return undefined;
      if (date instanceof Date) return date.toISOString().split('T')[0];
      return date.split('T')[0];
    };

    const generatedTemplates = await this.aiService.generateTemplates(
      {
        name: event.name,
        description: event.description,
        startDate: formatDate(event.startDate),
        endDate: formatDate(event.endDate),
        location: event.location,
        brandColors: event.brandColors,
        logoUrl: event.logoUrl,
        organizerName: event.organizerName,
      },
      count,
    );

    // Save templates to database
    const templates = generatedTemplates.map((generated) =>
      this.templateRepository.create({
        name: generated.name,
        design: {
          layout: generated.layout,
          backgroundColor: generated.backgroundColor,
          elements: generated.elements,
        },
        eventId: event.id,
        status: 'active',
      }),
    );

    return this.templateRepository.save(templates);
  }

  async findAll(): Promise<Template[]> {
    return this.templateRepository.find({
      where: { deletedAt: IsNull(), status: 'active' },
      order: { usageCount: 'DESC' },
    });
  }

  async findByEvent(eventId: string): Promise<Template[]> {
    return this.templateRepository.find({
      where: { eventId, deletedAt: IsNull(), status: 'active' },
    });
  }

  async findOne(id: string): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!template) {
      throw new NotFoundException(`Template with ID ${id} not found`);
    }

    return template;
  }

  async incrementUsage(id: string): Promise<void> {
    await this.templateRepository.increment({ id }, 'usageCount', 1);
  }

  /**
   * Generate background images for templates using DALL-E
   * Returns an array of image URLs for each style
   */
  async generateBackgrounds(
    eventId: string,
  ): Promise<{ modern: string; minimal: string; bold: string }> {
    const event = await this.eventsService.findOne(eventId);

    // Build event data for background generation with full context
    const eventData = {
      name: event.name,
      description: event.description,
      brandColors: event.brandColors,
    };

    // Generate backgrounds in parallel for each style
    const [modern, minimal, bold] = await Promise.all([
      this.aiService.generateBackgroundImage(eventData, 'modern'),
      this.aiService.generateBackgroundImage(eventData, 'minimal'),
      this.aiService.generateBackgroundImage(eventData, 'bold'),
    ]);

    return { modern, minimal, bold };
  }
}
