import { MockDataGenerator } from '../mock/mock-data.generator';

describe('MockDataGenerator', () => {
  describe('generateEventData', () => {
    it('should generate all required event fields from URL', () => {
      const url = 'https://example.com/events/tech-summit-2025';
      const result = MockDataGenerator.generateEventData(url);

      // Verify all required fields exist
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('description');
      expect(result).toHaveProperty('startDate');
      expect(result).toHaveProperty('endDate');
      expect(result).toHaveProperty('location');
      expect(result).toHaveProperty('brandColors');
      expect(result).toHaveProperty('organizerName');

      // Verify location structure
      expect(result.location).toHaveProperty('city');
      expect(result.location).toHaveProperty('country');
      expect(result.location).toHaveProperty('venue');
      expect(result.location).toHaveProperty('isVirtual');
    });

    it('should extract and capitalize event name from URL path', () => {
      const url = 'https://events.com/conferences/web-development-conference';
      const result = MockDataGenerator.generateEventData(url);

      // Should capitalize words from URL slug
      expect(result.name).toContain('Web Development Conference');
    });

    it('should generate deterministic data for same URL (caching friendly)', () => {
      const url = 'https://example.com/my-event';
      const result1 = MockDataGenerator.generateEventData(url);
      const result2 = MockDataGenerator.generateEventData(url);

      // Same URL should produce identical results (important for testing/caching)
      expect(result1).toEqual(result2);
    });

    it('should generate different data for different URLs', () => {
      const result1 = MockDataGenerator.generateEventData(
        'https://example.com/event-a',
      );
      const result2 = MockDataGenerator.generateEventData(
        'https://example.com/event-b',
      );

      expect(result1.name).not.toBe(result2.name);
    });

    it('should generate valid ISO date formats', () => {
      const url = 'https://example.com/event';
      const result = MockDataGenerator.generateEventData(url);

      // ISO date format: YYYY-MM-DD
      expect(result.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      // End date should be same or after start date
      const start = new Date(result.startDate ?? '');
      const end = new Date(result.endDate ?? '');
      expect(end.getTime()).toBeGreaterThanOrEqual(start.getTime());
    });

    it('should generate future dates for events', () => {
      const url = 'https://example.com/event';
      const result = MockDataGenerator.generateEventData(url);

      const startDate = new Date(result.startDate ?? '');
      const now = new Date();

      // Event dates should be in the future
      expect(startDate.getTime()).toBeGreaterThan(now.getTime());
    });

    it('should handle URLs with no path gracefully', () => {
      const url = 'https://example.com';
      const result = MockDataGenerator.generateEventData(url);

      // Should still generate valid data using hostname
      expect(result.name).toBeTruthy();
      expect(result.name.length).toBeGreaterThan(0);
    });

    it('should handle malformed URLs gracefully', () => {
      const url = 'not-a-valid-url';
      const result = MockDataGenerator.generateEventData(url);

      // Should not throw and should provide fallback
      expect(result.name).toBeTruthy();
    });

    it('should generate valid hex color codes', () => {
      const url = 'https://example.com/event';
      const result = MockDataGenerator.generateEventData(url);

      expect(result.brandColors).toBeDefined();
      expect(result.brandColors?.primary).toMatch(/^#[0-9A-Fa-f]{6}$/);
      expect(result.brandColors?.secondary).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });

    it('should generate organizer name from event name', () => {
      const url = 'https://example.com/tech-conference';
      const result = MockDataGenerator.generateEventData(url);

      // Organizer should be derived from event name
      expect(result.organizerName).toContain('Events');
    });

    it('should occasionally mark events as virtual', () => {
      // Generate many events and check some are virtual
      const urls = Array.from(
        { length: 20 },
        (_, i) => `https://example.com/event-${String(i)}`,
      );
      const results = urls.map((url) =>
        MockDataGenerator.generateEventData(url),
      );
      const virtualCount = results.filter((r) => r.location.isVirtual).length;

      // Should have some virtual events (approximately 20% based on hash % 5 === 0)
      expect(virtualCount).toBeGreaterThan(0);
      expect(virtualCount).toBeLessThan(results.length);
    });
  });

  describe('generateTemplates', () => {
    const mockEventData = {
      name: 'Test Event 2025',
      description: 'A test event',
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
      logoUrl: undefined,
      organizerName: 'Test Org',
    };

    it('should generate exact requested number of templates', () => {
      expect(
        MockDataGenerator.generateTemplates(mockEventData, 1),
      ).toHaveLength(1);
      expect(
        MockDataGenerator.generateTemplates(mockEventData, 2),
      ).toHaveLength(2);
      expect(
        MockDataGenerator.generateTemplates(mockEventData, 3),
      ).toHaveLength(3);
    });

    it('should cap templates at maximum available layouts', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 100);
      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should handle zero count gracefully', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 0);
      expect(result).toHaveLength(0);
    });

    it('should include all required template properties', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 1);
      const template = result[0];

      expect(template).toHaveProperty('name');
      expect(template).toHaveProperty('layout');
      expect(template).toHaveProperty('backgroundColor');
      expect(template).toHaveProperty('elements');

      // Name and layout should be non-empty strings
      expect(typeof template.name).toBe('string');
      expect(template.name.length).toBeGreaterThan(0);
      expect(['classic', 'modern', 'minimal']).toContain(template.layout);
    });

    it('should generate valid element structure', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 1);
      const template = result[0];

      expect(template.elements.length).toBeGreaterThan(0);

      template.elements.forEach((element) => {
        expect(element).toHaveProperty('id');
        expect(element).toHaveProperty('type');
        expect(element).toHaveProperty('properties');

        // Properties should have positioning
        expect(element.properties).toHaveProperty('x');
        expect(element.properties).toHaveProperty('y');
        expect(element.properties).toHaveProperty('width');
        expect(element.properties).toHaveProperty('height');
      });
    });

    it('should inject event name into text elements', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 1);
      const eventNameElement = result[0].elements.find(
        (e) => e.id === 'event-name',
      );

      expect(eventNameElement).toBeDefined();
      expect(eventNameElement?.type).toBe('text');
      expect(eventNameElement?.properties.content).toBe(mockEventData.name);
    });

    it("should include I'm Attending badge in templates", () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 1);
      const badgeElement = result[0].elements.find((e) => e.id === 'badge');

      expect(badgeElement).toBeDefined();
      expect(badgeElement?.properties.content).toBe("I'm Attending!");
    });

    it('should include user photo placeholder', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 1);
      const photoElement = result[0].elements.find(
        (e) => e.id === 'user-photo',
      );

      expect(photoElement).toBeDefined();
      expect(photoElement?.type).toBe('image');
    });

    it('should use brand colors in templates', () => {
      const customEventData = {
        ...mockEventData,
        brandColors: { primary: '#FF0000', secondary: '#00FF00' },
      };

      const result = MockDataGenerator.generateTemplates(customEventData, 3);

      // Modern template should use primary as background
      const modernTemplate = result.find((t) => t.layout === 'modern');
      expect(modernTemplate?.backgroundColor).toBe('#FF0000');
    });

    it('should generate all three layout types', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 3);
      const layouts = result.map((t) => t.layout);

      expect(layouts).toContain('classic');
      expect(layouts).toContain('modern');
      expect(layouts).toContain('minimal');
    });

    it('should handle event data without brand colors', () => {
      const eventWithoutColors = {
        ...mockEventData,
        brandColors: undefined,
      };

      const result = MockDataGenerator.generateTemplates(eventWithoutColors, 1);

      // Should use default colors
      expect(result[0].backgroundColor).toBeTruthy();
    });

    it('should generate valid color codes in templates', () => {
      const result = MockDataGenerator.generateTemplates(mockEventData, 3);

      result.forEach((template) => {
        expect(template.backgroundColor).toMatch(/^#[0-9A-Fa-f]{6}$/);

        template.elements.forEach((element) => {
          const fill = element.properties.fill;
          if (fill !== undefined && fill !== '') {
            expect(fill).toMatch(/^#[0-9A-Fa-f]{6}$/);
          }
        });
      });
    });
  });
});
