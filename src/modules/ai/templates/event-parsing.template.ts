import type { PromptVariables } from './prompt-template.interface';
import { JsonPromptTemplate } from './prompt-template.interface';
import type { ParsedEventData } from '../ai.interface';

export interface EventParsingInput extends PromptVariables {
  url: string;
  /** Pre-scraped data from HTML to augment vision analysis */
  scrapedData?: {
    title?: string;
    description?: string;
    logoUrl?: string;
    ogImage?: string;
    colors: string[];
    fontFamilies: string[];
  };
}

export class EventParsingTemplate extends JsonPromptTemplate<
  EventParsingInput,
  ParsedEventData
> {
  readonly id = 'event-parsing';
  readonly name = 'Event URL Parser';
  readonly description = 'Extracts event information from a URL';

  /**
   * Build prompt for text-only parsing (legacy)
   */
  build(input: EventParsingInput): string {
    const schemaExample = `{
  "name": "Event name",
  "description": "Brief description",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD or null",
  "location": {
    "venue": "Venue name or null",
    "city": "City",
    "country": "Country",
    "isVirtual": true/false
  },
  "brandColors": {
    "primary": "#hexcolor",
    "secondary": "#hexcolor or null"
  },
  "logoUrl": "URL or null",
  "organizerName": "Organizer name or null"
}`;

    return `
You are an event information extractor. Given an event URL, extract event details.

URL: ${input.url}

Instructions:
- Extract all available information about the event
- If a field cannot be determined, use null
- For brand colors, try to identify from the event website design
- Dates should be in YYYY-MM-DD format

${this.buildJsonInstructions(schemaExample)}
    `.trim();
  }

  /**
   * Build prompt for GPT-4 Vision analysis with screenshot
   */
  buildVisionPrompt(input: EventParsingInput): string {
    const scrapedInfo = input.scrapedData
      ? `
Pre-extracted data from HTML:
- Title: ${input.scrapedData.title ?? 'Not found'}
- Description: ${input.scrapedData.description ?? 'Not found'}
- Logo URL: ${input.scrapedData.logoUrl ?? 'Not found'}
- Hero/OG Image: ${input.scrapedData.ogImage ?? 'Not found'}
- Colors found in CSS: ${input.scrapedData.colors.length > 0 ? input.scrapedData.colors.join(', ') : 'None'}
- Fonts: ${input.scrapedData.fontFamilies.length > 0 ? input.scrapedData.fontFamilies.join(', ') : 'None'}
`
      : '';

    return `
Analyze this event/conference website screenshot and extract detailed information.

URL: ${input.url}
${scrapedInfo}

IMPORTANT: You must respond with ONLY valid JSON, no other text.

Extract the following in JSON format:
{
  "name": "Event name (required)",
  "description": "Brief 1-2 sentence description",
  "startDate": "YYYY-MM-DD format or null",
  "endDate": "YYYY-MM-DD format or null",
  "location": {
    "venue": "Venue name or null",
    "city": "City name",
    "country": "Country name",
    "isVirtual": true/false
  },
  "brandColors": {
    "primary": "#HEXCODE - main brand color visible in hero/header",
    "secondary": "#HEXCODE - secondary accent color or null",
    "accent": "#HEXCODE - accent/highlight color or null",
    "background": "#HEXCODE - main background color",
    "text": "#HEXCODE - main text color"
  },
  "logoUrl": "Logo URL if found, or null",
  "organizerName": "Organizer/company name or null",
  "visualStyle": {
    "style": "modern|classic|minimal|bold|playful|corporate",
    "typography": {
      "headingStyle": "sans-serif|serif|display|monospace",
      "bodyStyle": "sans-serif|serif",
      "weight": "light|regular|bold|heavy"
    },
    "designElements": ["list", "of", "observed", "elements"]
  },
  "heroImageUrl": "Hero/banner image URL if prominently displayed"
}

Guidelines for visual analysis:
- BRAND COLORS: Look at the header, buttons, and hero section - those show true brand colors
- VISUAL STYLE:
  * "modern" = clean lines, gradient, sans-serif, lots of whitespace
  * "classic" = traditional, serif fonts, structured layout
  * "minimal" = very simple, few colors, lots of white space
  * "bold" = strong colors, large typography, high contrast
  * "playful" = rounded shapes, bright colors, fun elements
  * "corporate" = professional, muted colors, formal
- DESIGN ELEMENTS: Note things like "gradient", "rounded-corners", "cards", "hero-image", "parallax", "icons", "illustrations"
- For dates, look for text like "September 15-17, 2024" and convert to YYYY-MM-DD
- For location, look for city names, venue names, or "Virtual" indicators
    `.trim();
  }

  getOutputSchema(): object {
    return {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        startDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        endDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
        location: {
          type: 'object',
          properties: {
            venue: { type: 'string' },
            city: { type: 'string' },
            country: { type: 'string' },
            isVirtual: { type: 'boolean' },
          },
        },
        brandColors: {
          type: 'object',
          properties: {
            primary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            secondary: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            accent: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            background: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
            text: { type: 'string', pattern: '^#[0-9A-Fa-f]{6}$' },
          },
        },
        logoUrl: { type: 'string' },
        organizerName: { type: 'string' },
        visualStyle: {
          type: 'object',
          properties: {
            style: {
              type: 'string',
              enum: [
                'modern',
                'classic',
                'minimal',
                'bold',
                'playful',
                'corporate',
              ],
            },
            typography: {
              type: 'object',
              properties: {
                headingStyle: {
                  type: 'string',
                  enum: ['sans-serif', 'serif', 'display', 'monospace'],
                },
                bodyStyle: { type: 'string', enum: ['sans-serif', 'serif'] },
                weight: {
                  type: 'string',
                  enum: ['light', 'regular', 'bold', 'heavy'],
                },
              },
            },
            designElements: { type: 'array', items: { type: 'string' } },
          },
        },
        heroImageUrl: { type: 'string' },
      },
    };
  }
}

// Export singleton instance
export const eventParsingTemplate = new EventParsingTemplate();
