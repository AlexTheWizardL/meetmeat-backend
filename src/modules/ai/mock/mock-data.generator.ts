import type { ParsedEventData, GeneratedTemplate } from '../ai.interface';

/**
 * Generates dynamic mock data for development without API keys.
 * All data is derived from input parameters to ensure consistency.
 */
export class MockDataGenerator {
  private static readonly COLORS = [
    { primary: '#6C5CE7', secondary: '#A29BFE' },
    { primary: '#00B894', secondary: '#55EFC4' },
    { primary: '#E17055', secondary: '#FAB1A0' },
    { primary: '#0984E3', secondary: '#74B9FF' },
    { primary: '#D63031', secondary: '#FF7675' },
  ];

  private static readonly CITIES = [
    { city: 'San Francisco', country: 'USA', venue: 'Moscone Center' },
    { city: 'New York', country: 'USA', venue: 'Javits Center' },
    { city: 'London', country: 'UK', venue: 'ExCeL London' },
    { city: 'Berlin', country: 'Germany', venue: 'Messe Berlin' },
    { city: 'Tokyo', country: 'Japan', venue: 'Tokyo Big Sight' },
  ];

  private static readonly LAYOUTS = ['classic', 'modern', 'minimal'] as const;
  private static readonly FONTS = ['Arial', 'Helvetica', 'Georgia'];

  /**
   * Generate a hash from URL to get consistent random values
   */
  private static hashUrl(url: string): number {
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Extract event name from URL path
   */
  private static extractEventName(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname
        .split('/')
        .filter((p) => p.length > 0)
        .map((p) => p.replace(/-/g, ' '));

      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        return lastPart
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      }

      return urlObj.hostname.replace(/^www\./, '').split('.')[0];
    } catch {
      return 'Conference Event';
    }
  }

  /**
   * Generate mock event data based on URL
   */
  static generateEventData(url: string): ParsedEventData {
    const hash = this.hashUrl(url);
    const colorIndex = hash % this.COLORS.length;
    const locationIndex = hash % this.CITIES.length;

    const eventName = this.extractEventName(url);
    const year = new Date().getFullYear();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (hash % 180) + 30);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (hash % 3) + 1);

    return {
      name: `${eventName} ${year}`,
      description: `Join us for ${eventName} - the premier event for professionals`,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      location: {
        ...this.CITIES[locationIndex],
        isVirtual: hash % 5 === 0,
      },
      brandColors: this.COLORS[colorIndex],
      logoUrl: undefined,
      organizerName: `${eventName.split(' ')[0]} Events`,
    };
  }

  /**
   * Generate mock templates based on event data
   */
  static generateTemplates(
    eventData: ParsedEventData,
    count: number,
  ): GeneratedTemplate[] {
    const templates: GeneratedTemplate[] = [];
    const primaryColor = eventData.brandColors?.primary || '#6C5CE7';
    const secondaryColor = eventData.brandColors?.secondary || '#A29BFE';

    const templateConfigs = [
      {
        name: 'Classic Professional',
        layout: 'classic' as const,
        bgColor: '#FFFFFF',
        textColor: '#1A1A2E',
        accentColor: primaryColor,
      },
      {
        name: 'Modern Gradient',
        layout: 'modern' as const,
        bgColor: primaryColor,
        textColor: '#FFFFFF',
        accentColor: secondaryColor,
      },
      {
        name: 'Minimal Clean',
        layout: 'minimal' as const,
        bgColor: '#F5F5F7',
        textColor: '#1A1A2E',
        accentColor: primaryColor,
      },
    ];

    for (let i = 0; i < Math.min(count, templateConfigs.length); i++) {
      const config = templateConfigs[i];
      const font = this.FONTS[i % this.FONTS.length];

      templates.push({
        name: config.name,
        layout: config.layout,
        backgroundColor: config.bgColor,
        elements: this.generateElements(
          eventData.name,
          config.textColor,
          config.accentColor,
          font,
          config.layout,
        ),
      });
    }

    return templates;
  }

  private static generateElements(
    eventName: string,
    textColor: string,
    accentColor: string,
    fontFamily: string,
    layout: 'classic' | 'modern' | 'minimal',
  ): GeneratedTemplate['elements'] {
    const layoutConfigs = {
      classic: {
        title: { x: 10, y: 10, width: 80, height: 15, fontSize: 32 },
        badge: { x: 10, y: 70, width: 40, height: 10, fontSize: 24 },
        photo: { x: 60, y: 30, width: 30, height: 30 },
        logo: { x: 70, y: 5, width: 20, height: 10 },
      },
      modern: {
        title: { x: 10, y: 60, width: 80, height: 15, fontSize: 28 },
        badge: { x: 10, y: 80, width: 40, height: 10, fontSize: 20 },
        photo: { x: 25, y: 10, width: 50, height: 40 },
        logo: { x: 5, y: 5, width: 15, height: 8 },
      },
      minimal: {
        title: { x: 10, y: 75, width: 80, height: 10, fontSize: 24 },
        badge: { x: 10, y: 88, width: 30, height: 8, fontSize: 16 },
        photo: { x: 20, y: 15, width: 60, height: 50 },
        logo: null,
      },
    };

    const config = layoutConfigs[layout];

    const elements: GeneratedTemplate['elements'] = [
      {
        id: 'event-name',
        type: 'text',
        properties: {
          x: config.title.x,
          y: config.title.y,
          width: config.title.width,
          height: config.title.height,
          content: eventName,
          fill: textColor,
          fontSize: config.title.fontSize,
          fontFamily,
        },
      },
      {
        id: 'badge',
        type: 'text',
        properties: {
          x: config.badge.x,
          y: config.badge.y,
          width: config.badge.width,
          height: config.badge.height,
          content: "I'm Attending!",
          fill: accentColor,
          fontSize: config.badge.fontSize,
          fontFamily,
        },
      },
      {
        id: 'user-photo',
        type: 'image',
        properties: {
          x: config.photo.x,
          y: config.photo.y,
          width: config.photo.width,
          height: config.photo.height,
        },
      },
    ];

    if (config.logo) {
      elements.push({
        id: 'event-logo',
        type: 'logo',
        properties: {
          x: config.logo.x,
          y: config.logo.y,
          width: config.logo.width,
          height: config.logo.height,
        },
      });
    }

    return elements;
  }
}
