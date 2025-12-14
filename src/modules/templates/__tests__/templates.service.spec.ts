import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { TemplatesService } from '../templates.service';
import { Template } from '../entities/template.entity';
import { EventsService } from '../../events/events.service';
import { AiService } from '../../ai/ai.service';
import type { GeneratedTemplate } from '../../ai/ai.interface';

describe('TemplatesService', () => {
  let service: TemplatesService;
  let _repository: jest.Mocked<Repository<Template>>;
  let eventsService: jest.Mocked<EventsService>;
  let aiService: jest.Mocked<AiService>;

  const mockTemplate: Template = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    eventId: 'event-123',
    name: 'Modern Layout',
    design: {
      layout: 'modern',
      backgroundColor: '#6C5CE7',
      elements: [
        {
          id: 'event-name',
          type: 'text',
          properties: {
            x: 10,
            y: 10,
            width: 80,
            height: 15,
            content: 'Tech Summit 2025',
            fill: '#FFFFFF',
            fontSize: 32,
          },
        },
      ],
    },
    status: 'active',
    usageCount: 0,
    previewImageUrl: 'https://example.com/thumb.png',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: undefined,
    version: 1,
  };

  const mockEvent = {
    id: 'event-123',
    name: 'Tech Summit 2025',
    description: 'Annual tech conference',
    startDate: new Date('2025-06-15'),
    endDate: new Date('2025-06-17'),
    location: { city: 'San Francisco', country: 'USA', isVirtual: false },
    brandColors: { primary: '#6C5CE7', secondary: '#A29BFE' },
    logoUrl: 'https://example.com/logo.png',
    organizerName: 'Tech Events Inc',
  };

  const mockGeneratedTemplates: GeneratedTemplate[] = [
    {
      name: 'Classic',
      layout: 'classic',
      backgroundColor: '#FFFFFF',
      elements: [
        {
          id: 'event-name',
          type: 'text',
          properties: { x: 10, y: 10, width: 80, height: 15 },
        },
      ],
    },
    {
      name: 'Modern',
      layout: 'modern',
      backgroundColor: '#6C5CE7',
      elements: [
        {
          id: 'event-name',
          type: 'text',
          properties: { x: 10, y: 60, width: 80, height: 15 },
        },
      ],
    },
  ];

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    increment: jest.fn(),
  };

  const mockEventsService = {
    findOne: jest.fn(),
  };

  const mockAiService = {
    generateTemplates: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TemplatesService,
        {
          provide: getRepositoryToken(Template),
          useValue: mockRepository,
        },
        {
          provide: EventsService,
          useValue: mockEventsService,
        },
        {
          provide: AiService,
          useValue: mockAiService,
        },
      ],
    }).compile();

    service = module.get<TemplatesService>(TemplatesService);
    _repository = module.get(getRepositoryToken(Template));
    eventsService = module.get(EventsService);
    aiService = module.get(AiService);

    jest.clearAllMocks();
  });

  describe('generateForEvent', () => {
    it('should generate templates using AI and save them', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockAiService.generateTemplates.mockResolvedValue(mockGeneratedTemplates);
      mockRepository.create.mockImplementation((data) => ({
        ...mockTemplate,
        ...data,
        id: `template-${String(Math.random())}`,
      }));
      mockRepository.save.mockImplementation((templates) =>
        Promise.resolve(templates),
      );

      const result = await service.generateForEvent('event-123', 2);

      expect(eventsService.findOne).toHaveBeenCalledWith('event-123');
      expect(aiService.generateTemplates).toHaveBeenCalledWith(
        expect.objectContaining({ name: mockEvent.name }),
        2,
      );
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException when event not found', async () => {
      mockEventsService.findOne.mockRejectedValue(new NotFoundException());

      await expect(service.generateForEvent('non-existent', 2)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should use default count of 3 templates', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockAiService.generateTemplates.mockResolvedValue(mockGeneratedTemplates);
      mockRepository.create.mockImplementation((data) => ({
        ...mockTemplate,
        ...data,
      }));
      mockRepository.save.mockImplementation((templates) =>
        Promise.resolve(templates),
      );

      await service.generateForEvent('event-123');

      expect(aiService.generateTemplates).toHaveBeenCalledWith(
        expect.anything(),
        3,
      );
    });

    it('should link templates to the event', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockAiService.generateTemplates.mockResolvedValue([
        mockGeneratedTemplates[0],
      ]);
      mockRepository.create.mockImplementation((data) => ({
        ...mockTemplate,
        ...data,
      }));
      mockRepository.save.mockImplementation((templates) =>
        Promise.resolve(templates),
      );

      const result = await service.generateForEvent('event-123', 1);

      expect(result[0].eventId).toBe('event-123');
    });

    it('should store design with layout, backgroundColor, and elements', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockAiService.generateTemplates.mockResolvedValue([
        mockGeneratedTemplates[0],
      ]);
      mockRepository.create.mockImplementation((data) => ({
        ...mockTemplate,
        ...data,
      }));
      mockRepository.save.mockImplementation((templates) =>
        Promise.resolve(templates),
      );

      await service.generateForEvent('event-123', 1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          design: expect.objectContaining({
            layout: 'classic',
            backgroundColor: '#FFFFFF',
            elements: expect.any(Array),
          }),
        }),
      );
    });

    it('should set status to active for new templates', async () => {
      mockEventsService.findOne.mockResolvedValue(mockEvent);
      mockAiService.generateTemplates.mockResolvedValue([
        mockGeneratedTemplates[0],
      ]);
      mockRepository.create.mockImplementation((data) => ({
        ...mockTemplate,
        ...data,
      }));
      mockRepository.save.mockImplementation((templates) =>
        Promise.resolve(templates),
      );

      await service.generateForEvent('event-123', 1);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all active non-deleted templates ordered by usage', async () => {
      const templates = [mockTemplate, { ...mockTemplate, id: 'another-id' }];
      mockRepository.find.mockResolvedValue(templates);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull(), status: 'active' },
        order: { usageCount: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no templates exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findByEvent', () => {
    it('should return active templates for specific event', async () => {
      const eventTemplates = [mockTemplate];
      mockRepository.find.mockResolvedValue(eventTemplates);

      const result = await service.findByEvent('event-123');

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { eventId: 'event-123', deletedAt: IsNull(), status: 'active' },
      });
      expect(result).toHaveLength(1);
    });

    it('should return empty array when event has no templates', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findByEvent('event-without-templates');

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return template by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockTemplate);

      const result = await service.findOne(mockTemplate.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockTemplate.id, deletedAt: IsNull() },
      });
      expect(result).toEqual(mockTemplate);
    });

    it('should throw NotFoundException when template not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should include template ID in error message', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('test-id-123')).rejects.toThrow(
        'Template with ID test-id-123 not found',
      );
    });
  });

  describe('incrementUsage', () => {
    it('should increment usage count for template', async () => {
      mockRepository.increment.mockResolvedValue({ affected: 1 } as never);

      await service.incrementUsage(mockTemplate.id);

      expect(mockRepository.increment).toHaveBeenCalledWith(
        { id: mockTemplate.id },
        'usageCount',
        1,
      );
    });
  });
});
