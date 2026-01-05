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
   * Enhanced to capture full visual language (gradients, shadows, decorative elements)
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
Analyze this event/conference website screenshot. Your goal is to capture the VISUAL VIBE so we can create posters that feel like they belong to this event.

URL: ${input.url}
${scrapedInfo}

IMPORTANT: Respond with ONLY valid JSON, no other text.

{
  "name": "Event name (required)",
  "description": "Brief 1-2 sentence description",
  "startDate": "YYYY-MM-DD or null",
  "endDate": "YYYY-MM-DD or null",
  "location": {
    "venue": "Venue name or null",
    "city": "City name",
    "country": "Country name",
    "isVirtual": true/false
  },
  "brandColors": {
    "primary": "#HEXCODE - dominant brand color",
    "secondary": "#HEXCODE - secondary color or null",
    "accent": "#HEXCODE - accent/CTA color or null",
    "background": "#HEXCODE - main background",
    "text": "#HEXCODE - main text color"
  },
  "logoUrl": "Logo URL or null",
  "organizerName": "Organizer name or null",
  "visualStyle": {
    "style": "modern|classic|minimal|bold|playful|corporate",
    "typography": {
      "headingStyle": "sans-serif|serif|display|monospace",
      "bodyStyle": "sans-serif|serif",
      "weight": "light|regular|bold|heavy",
      "letterSpacing": "tight|normal|wide"
    },
    "gradient": {
      "type": "linear|radial",
      "angle": 135,
      "colors": ["#start", "#end"],
      "positions": [0, 1]
    },
    "shadow": {
      "type": "soft|hard|glow|none",
      "color": "#000000",
      "blur": 20,
      "offsetX": 0,
      "offsetY": 10
    },
    "decorativeElements": [
      {
        "type": "line|circle|rectangle|blob|dots|grid",
        "position": "top-left|top-right|bottom-left|bottom-right|background|border",
        "color": "#HEXCODE",
        "opacity": 0.5,
        "size": 30
      }
    ],
    "designElements": ["gradient", "rounded-corners", "cards", etc.]
  },
  "heroImageUrl": "Hero image URL or null"
}

=== VISUAL ANALYSIS GUIDE ===

1. GRADIENTS (Critical for capturing vibe):
   - Look at hero sections, buttons, overlays
   - "linear" = color transitions in one direction (specify angle: 0=top-down, 90=left-right, 135=diagonal)
   - "radial" = color radiates from center
   - Capture the exact colors in the gradient (usually 2-3 colors)
   - If NO gradient visible, set gradient to null

2. SHADOWS (Creates depth and style):
   - "soft" = blurry, subtle shadow (modern look)
   - "hard" = crisp, defined shadow (bold look)
   - "glow" = colored glow around elements (playful/tech look)
   - "none" = flat design, no shadows
   - Look at cards, buttons, images for shadow style

3. DECORATIVE ELEMENTS (Creates uniqueness):
   - Look for geometric shapes (circles, lines, blobs)
   - Note their position (corner decorations, background patterns)
   - Capture their color and transparency
   - Examples: floating circles, diagonal lines, dot patterns, grid backgrounds

4. TYPOGRAPHY:
   - "display" = decorative/unique headline fonts
   - "heavy" = extra bold, impactful
   - "tight" letterSpacing = modern tech feel
   - "wide" letterSpacing = elegant, spaced out

5. OVERALL STYLE:
   - "modern" = gradients, soft shadows, sans-serif, whitespace
   - "bold" = high contrast, strong colors, hard shadows
   - "playful" = rounded shapes, bright colors, glows
   - "minimal" = few colors, no decorations, lots of space
   - "corporate" = muted colors, structured, professional
   - "classic" = serif fonts, traditional layout
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
                letterSpacing: {
                  type: 'string',
                  enum: ['tight', 'normal', 'wide'],
                },
              },
            },
            gradient: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['linear', 'radial'] },
                angle: { type: 'number', minimum: 0, maximum: 360 },
                colors: { type: 'array', items: { type: 'string' } },
                positions: { type: 'array', items: { type: 'number' } },
              },
            },
            shadow: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['soft', 'hard', 'glow', 'none'],
                },
                color: { type: 'string' },
                blur: { type: 'number' },
                offsetX: { type: 'number' },
                offsetY: { type: 'number' },
              },
            },
            decorativeElements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: [
                      'line',
                      'circle',
                      'rectangle',
                      'blob',
                      'dots',
                      'grid',
                    ],
                  },
                  position: {
                    type: 'string',
                    enum: [
                      'top-left',
                      'top-right',
                      'bottom-left',
                      'bottom-right',
                      'background',
                      'border',
                    ],
                  },
                  color: { type: 'string' },
                  opacity: { type: 'number', minimum: 0, maximum: 1 },
                  size: { type: 'number' },
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

export const eventParsingTemplate = new EventParsingTemplate();
