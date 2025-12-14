import type { PromptVariables } from './prompt-template.interface';
import { JsonPromptTemplate } from './prompt-template.interface';
import type { ParsedEventData, GeneratedTemplate } from '../ai.interface';

export interface TemplateGenerationInput extends PromptVariables {
  eventData: ParsedEventData;
  count: number;
  layouts?: string[];
}

export interface TemplateGenerationOutput {
  templates: GeneratedTemplate[];
}

export class TemplateGenerationTemplate extends JsonPromptTemplate<
  TemplateGenerationInput,
  TemplateGenerationOutput
> {
  readonly id = 'template-generation';
  readonly name = 'Poster Template Generator';
  readonly description = 'Generates poster templates based on event data';

  build(input: TemplateGenerationInput): string {
    const layouts = input.layouts || ['classic', 'modern', 'minimal', 'bold'];

    const schemaExample = `{
  "templates": [
    {
      "name": "Template name",
      "layout": "${layouts[0]}",
      "backgroundColor": "#hexcolor",
      "elements": [
        {
          "id": "unique-id",
          "type": "text|image|shape|logo",
          "properties": {
            "x": 0-100,
            "y": 0-100,
            "width": 0-100,
            "height": 0-100,
            "content": "Text content",
            "fill": "#hexcolor",
            "fontSize": 24,
            "fontFamily": "Arial"
          }
        }
      ]
    }
  ]
}`;

    return `
You are a poster template designer. Create ${input.count} different "I'm attending" poster templates.

Event Details:
${JSON.stringify(input.eventData, null, 2)}

Requirements:
- Create ${input.count} unique templates with different layouts: ${layouts.join(', ')}
- Each template must include:
  * Event name text element
  * Event date (if available)
  * "I'm Attending!" badge/text
  * Placeholder area for user photo (type: "image", id: "user-photo")
  * Event logo placeholder (type: "logo", id: "event-logo")
- Use the event's brand colors when available
- Positions (x, y, width, height) are percentages (0-100)
- Font sizes are in pixels

${this.buildJsonInstructions(schemaExample)}
    `.trim();
  }

  parse(response: string): TemplateGenerationOutput {
    const parsed = super.parse(response);

    // Handle case where AI returns just an array instead of {templates: [...]}
    if (Array.isArray(parsed)) {
      return { templates: parsed };
    }

    return parsed;
  }

  getOutputSchema(): object {
    return {
      type: 'object',
      required: ['templates'],
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            required: ['name', 'layout', 'backgroundColor', 'elements'],
            properties: {
              name: { type: 'string' },
              layout: {
                type: 'string',
                enum: ['classic', 'modern', 'minimal', 'bold'],
              },
              backgroundColor: {
                type: 'string',
                pattern: '^#[0-9A-Fa-f]{6}$',
              },
              elements: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'type', 'properties'],
                },
              },
            },
          },
        },
      },
    };
  }
}

// Export singleton instance
export const templateGenerationTemplate = new TemplateGenerationTemplate();
