import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Event } from './entities/event.entity';
import { AiService } from '../ai/ai.service';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly aiService: AiService,
  ) {}

  async parseFromUrl(url: string): Promise<Event> {
    // Check if we already have this event cached
    const existing = await this.eventRepository.findOne({
      where: { sourceUrl: url, deletedAt: IsNull() },
    });

    if (existing) {
      return existing;
    }

    // Parse event using AI
    const parsedData = await this.aiService.parseEventFromUrl(url);

    // Create and save the event
    const event = this.eventRepository.create({
      sourceUrl: url,
      name: parsedData.name,
      description: parsedData.description,
      startDate:
        parsedData.startDate !== undefined && parsedData.startDate !== ''
          ? new Date(parsedData.startDate)
          : undefined,
      endDate:
        parsedData.endDate !== undefined && parsedData.endDate !== ''
          ? new Date(parsedData.endDate)
          : undefined,
      location: parsedData.location,
      brandColors: parsedData.brandColors,
      logoUrl: parsedData.logoUrl,
      organizerName: parsedData.organizerName,
      rawMetadata: parsedData as unknown as Record<string, unknown>,
    });

    return this.eventRepository.save(event);
  }

  async findOne(id: string): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async findByUrl(url: string): Promise<Event | null> {
    return this.eventRepository.findOne({
      where: { sourceUrl: url, deletedAt: IsNull() },
    });
  }
}
