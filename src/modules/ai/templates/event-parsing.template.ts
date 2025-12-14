import type { PromptVariables } from './prompt-template.interface';
import { JsonPromptTemplate } from './prompt-template.interface';
import type { ParsedEventData } from '../ai.interface';

export interface EventParsingInput extends PromptVariables {
  url: string;
}

export class EventParsingTemplate extends JsonPromptTemplate<
  EventParsingInput,
  ParsedEventData
> {
  readonly id = 'event-parsing';
  readonly name = 'Event URL Parser';
  readonly description = 'Extracts event information from a URL';

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
          },
        },
        logoUrl: { type: 'string' },
        organizerName: { type: 'string' },
      },
    };
  }
}

// Export singleton instance
export const eventParsingTemplate = new EventParsingTemplate();
