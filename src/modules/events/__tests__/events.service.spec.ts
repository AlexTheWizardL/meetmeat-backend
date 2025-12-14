import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { EventsService } from '../events.service';
import { Event } from '../entities/event.entity';
import { AiService } from '../../ai/ai.service';
import type { ParsedEventData } from '../../ai/ai.interface';

describe('EventsService', () => {
  let service: EventsService;
  let _repository: jest.Mocked<Repository<Event>>;
  let aiService: jest.Mocked<AiService>;

  const mockEvent: Event = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    sourceUrl: 'https://example.com/tech-summit-2025',
    name: 'Tech Summit 2025',
    description: 'Annual technology conference',
    startDate: new Date('2025-06-15'),
    endDate: new Date('2025-06-17'),
    location: {
      city: 'San Francisco',
      country: 'USA',
      venue: 'Moscone Center',
      isVirtual: false,
    },
    brandColors: {
      primary: '#6C5CE7',
      secondary: '#A29BFE',
    },
    logoUrl: 'https://example.com/logo.png',
    organizerName: 'Tech Events Inc',
    rawMetadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: undefined,
    version: 1,
  };

  const mockParsedEventData: ParsedEventData = {
    name: 'Tech Summit 2025',
    description: 'Annual technology conference',
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    location: {
      city: 'San Francisco',
      country: 'USA',
      venue: 'Moscone Center',
      isVirtual: false,
    },
    brandColors: {
      primary: '#6C5CE7',
      secondary: '#A29BFE',
    },
    logoUrl: 'https://example.com/logo.png',
    organizerName: 'Tech Events Inc',
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAiService = {
    parseEventFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventsService,
        {
          provide: getRepositoryToken(Event),
          useValue: mockRepository,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
    _repository = module.get(getRepositoryToken(Event));
    aiService = module.get(AiService);

    jest.clearAllMocks();
  });

  describe('parseFromUrl', () => {
    const testUrl = 'https://example.com/tech-summit-2025';

    it('should return cached event if URL already parsed', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.parseFromUrl(testUrl);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sourceUrl: testUrl, deletedAt: IsNull() },
      });
      expect(aiService.parseEventFromUrl).not.toHaveBeenCalled();
      expect(result).toEqual(mockEvent);
    });

    it('should parse URL with AI and save new event when not cached', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockAiService.parseEventFromUrl.mockResolvedValue(mockParsedEventData);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      const result = await service.parseFromUrl(testUrl);

      expect(aiService.parseEventFromUrl).toHaveBeenCalledWith(testUrl);
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.sourceUrl).toBe(testUrl);
    });

    it('should handle events without dates', async () => {
      const parsedDataNoDates: ParsedEventData = {
        ...mockParsedEventData,
        startDate: undefined,
        endDate: undefined,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockAiService.parseEventFromUrl.mockResolvedValue(parsedDataNoDates);
      mockRepository.create.mockReturnValue({
        ...mockEvent,
        startDate: undefined,
        endDate: undefined,
      });
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        startDate: undefined,
        endDate: undefined,
      });

      const result = await service.parseFromUrl(testUrl);

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should handle events with empty date strings', async () => {
      const parsedDataEmptyDates: ParsedEventData = {
        ...mockParsedEventData,
        startDate: '',
        endDate: '',
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockAiService.parseEventFromUrl.mockResolvedValue(parsedDataEmptyDates);
      mockRepository.create.mockReturnValue({
        ...mockEvent,
        startDate: undefined,
        endDate: undefined,
      });
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        startDate: undefined,
        endDate: undefined,
      });

      await service.parseFromUrl(testUrl);

      // Verify create was called - dates should be undefined for empty strings
      expect(mockRepository.create).toHaveBeenCalled();
    });

    it('should handle virtual events', async () => {
      const virtualEvent: ParsedEventData = {
        ...mockParsedEventData,
        location: {
          isVirtual: true,
        },
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockAiService.parseEventFromUrl.mockResolvedValue(virtualEvent);
      mockRepository.create.mockReturnValue({
        ...mockEvent,
        location: { isVirtual: true },
      });
      mockRepository.save.mockResolvedValue({
        ...mockEvent,
        location: { isVirtual: true },
      });

      const result = await service.parseFromUrl(testUrl);

      expect(result.location?.isVirtual).toBe(true);
    });

    it('should store raw metadata for debugging', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockAiService.parseEventFromUrl.mockResolvedValue(mockParsedEventData);
      mockRepository.create.mockReturnValue(mockEvent);
      mockRepository.save.mockResolvedValue(mockEvent);

      await service.parseFromUrl(testUrl);

      const createCall = mockRepository.create.mock.calls[0][0];
      expect(createCall.rawMetadata).toBeDefined();
    });
  });

  describe('findOne', () => {
    it('should return event by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findOne(mockEvent.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id, deletedAt: IsNull() },
      });
      expect(result).toEqual(mockEvent);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return soft-deleted events', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockEvent.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockEvent.id, deletedAt: IsNull() },
      });
    });
  });

  describe('findByUrl', () => {
    it('should return event by source URL', async () => {
      mockRepository.findOne.mockResolvedValue(mockEvent);

      const result = await service.findByUrl(mockEvent.sourceUrl);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { sourceUrl: mockEvent.sourceUrl, deletedAt: IsNull() },
      });
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event not found by URL', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUrl('https://unknown.com/event');

      expect(result).toBeNull();
    });
  });
});
