import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Event } from './entities/event.entity';
import { AiService } from '../ai/ai.service';

// Internal IP ranges to block (SSRF protection)
const BLOCKED_IP_PATTERNS = [
  /^127\./, // Localhost
  /^10\./, // Private Class A
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // Private Class B
  /^192\.168\./, // Private Class C
  /^169\.254\./, // Link-local
  /^0\./, // Current network
  /^localhost$/i,
  /^.*\.local$/i,
];

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    private readonly aiService: AiService,
  ) {}

  private validateUrl(url: string): void {
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    // Only allow http and https
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new BadRequestException('Only HTTP and HTTPS URLs are allowed');
    }

    // Block internal IPs and hostnames
    const hostname = parsedUrl.hostname;
    for (const pattern of BLOCKED_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        throw new BadRequestException(
          'URLs pointing to internal resources are not allowed',
        );
      }
    }
  }

  async parseFromUrl(url: string): Promise<Event> {
    // Validate URL to prevent SSRF attacks
    this.validateUrl(url);

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
