import { eventParsingTemplate, templateGenerationTemplate } from '../templates';

describe('Event Parsing Template', () => {
  describe('build', () => {
    it('should build a prompt containing the URL', () => {
      const url = 'https://example.com/event';
      const prompt = eventParsingTemplate.build({ url });

      expect(prompt).toContain(url);
      expect(prompt).toContain('event information extractor');
    });

    it('should include JSON format instructions', () => {
      const prompt = eventParsingTemplate.build({ url: 'https://test.com' });

      expect(prompt.toLowerCase()).toContain('json');
    });
  });

  describe('parse', () => {
    it('should parse valid JSON response', () => {
      const response = JSON.stringify({
        name: 'Test Event',
        description: 'A test event',
        startDate: '2025-01-15',
        endDate: '2025-01-17',
        location: {
          city: 'New York',
          country: 'USA',
          venue: 'Test Venue',
          isVirtual: false,
        },
        brandColors: {
          primary: '#FF0000',
          secondary: '#00FF00',
        },
        logoUrl: undefined,
        organizerName: 'Test Org',
      });

      const result = eventParsingTemplate.parse(response);

      expect(result.name).toBe('Test Event');
      expect(result.startDate).toBe('2025-01-15');
      expect(result.location.city).toBe('New York');
    });

    it('should handle JSON wrapped in markdown code blocks', () => {
      const response =
        '```json\n{"name": "Test Event", "description": "Test"}\n```';
      const result = eventParsingTemplate.parse(response);

      expect(result.name).toBe('Test Event');
    });

    it('should throw error for invalid JSON', () => {
      expect(() => {
        eventParsingTemplate.parse('not valid json');
      }).toThrow();
    });
  });
});

describe('Template Generation Template', () => {
  const mockEventData = {
    name: 'Test Conference 2025',
    description: 'A test conference',
    startDate: '2025-06-15',
    endDate: '2025-06-17',
    location: {
      city: 'San Francisco',
      country: 'USA',
      venue: 'Convention Center',
      isVirtual: false,
    },
    brandColors: {
      primary: '#6C5CE7',
      secondary: '#A29BFE',
    },
    logoUrl: null,
    organizerName: 'Test Events',
  };

  describe('build', () => {
    it('should build a prompt containing event data', () => {
      const prompt = templateGenerationTemplate.build({
        eventData: mockEventData,
        count: 3,
      });

      expect(prompt).toContain(mockEventData.name);
      expect(prompt).toContain('3');
    });

    it('should include brand colors in prompt', () => {
      const prompt = templateGenerationTemplate.build({
        eventData: mockEventData,
        count: 2,
      });

      expect(prompt).toContain('#6C5CE7');
    });
  });

  describe('parse', () => {
    it('should parse templates array response', () => {
      const response = JSON.stringify({
        templates: [
          {
            name: 'Modern Layout',
            layout: 'modern',
            backgroundColor: '#FFFFFF',
            elements: [
              {
                id: 'title',
                type: 'text',
                properties: { x: 10, y: 10, content: 'Test' },
              },
            ],
          },
        ],
      });

      const result = templateGenerationTemplate.parse(response);

      expect(result.templates).toHaveLength(1);
      expect(result.templates[0].name).toBe('Modern Layout');
      expect(result.templates[0].elements).toHaveLength(1);
    });

    it('should handle markdown-wrapped JSON', () => {
      const response =
        '```json\n{"templates": [{"name": "Test", "layout": "minimal", "backgroundColor": "#FFF", "elements": []}]}\n```';
      const result = templateGenerationTemplate.parse(response);

      expect(result.templates[0].name).toBe('Test');
    });
  });
});
