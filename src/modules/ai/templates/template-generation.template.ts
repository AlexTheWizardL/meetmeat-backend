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

/**
 * Few-shot examples for consistent template generation
 */
const FEW_SHOT_EXAMPLES = `
=== EXAMPLE 1 ===
Input Event:
{
  "name": "TechConf 2024",
  "brandColors": { "primary": "#6C5CE7", "secondary": "#A29BFE" },
  "visualStyle": { "style": "modern", "typography": { "headingStyle": "sans-serif", "weight": "bold" } }
}

Output Template (modern layout):
{
  "name": "Modern Gradient",
  "layout": "modern",
  "backgroundColor": "#6C5CE7",
  "elements": [
    { "id": "event-name", "type": "text", "properties": { "x": 5, "y": 8, "width": 90, "height": 12, "content": "TechConf 2024", "fill": "#FFFFFF", "fontSize": 42, "fontFamily": "Inter", "fontWeight": "800" } },
    { "id": "event-date", "type": "text", "properties": { "x": 5, "y": 22, "width": 90, "height": 6, "content": "March 15-17, 2024", "fill": "#A29BFE", "fontSize": 20, "fontFamily": "Inter", "fontWeight": "500" } },
    { "id": "attending-badge", "type": "shape", "properties": { "x": 5, "y": 75, "width": 40, "height": 12, "fill": "#FFFFFF", "content": "I'm Attending!", "fontSize": 18, "fontFamily": "Inter", "fontWeight": "700" } },
    { "id": "user-photo", "type": "image", "properties": { "x": 60, "y": 35, "width": 35, "height": 45 } },
    { "id": "user-name", "type": "text", "properties": { "x": 5, "y": 88, "width": 50, "height": 6, "content": "", "fill": "#FFFFFF", "fontSize": 16, "fontFamily": "Inter", "fontWeight": "600" } },
    { "id": "event-logo", "type": "logo", "properties": { "x": 80, "y": 5, "width": 15, "height": 10 } }
  ]
}

=== EXAMPLE 2 ===
Input Event:
{
  "name": "Design Summit",
  "brandColors": { "primary": "#2D3436", "secondary": "#E17055" },
  "visualStyle": { "style": "minimal", "typography": { "headingStyle": "serif", "weight": "regular" } }
}

Output Template (minimal layout):
{
  "name": "Clean Minimal",
  "layout": "minimal",
  "backgroundColor": "#FAFAFA",
  "elements": [
    { "id": "event-name", "type": "text", "properties": { "x": 10, "y": 15, "width": 80, "height": 10, "content": "Design Summit", "fill": "#2D3436", "fontSize": 32, "fontFamily": "Playfair Display", "fontWeight": "400" } },
    { "id": "event-date", "type": "text", "properties": { "x": 10, "y": 27, "width": 80, "height": 5, "content": "June 20, 2024", "fill": "#636E72", "fontSize": 14, "fontFamily": "Inter", "fontWeight": "400" } },
    { "id": "divider", "type": "shape", "properties": { "x": 10, "y": 35, "width": 20, "height": 0.5, "fill": "#E17055" } },
    { "id": "attending-badge", "type": "text", "properties": { "x": 10, "y": 40, "width": 80, "height": 6, "content": "I'm Attending", "fill": "#2D3436", "fontSize": 16, "fontFamily": "Inter", "fontWeight": "500" } },
    { "id": "user-photo", "type": "image", "properties": { "x": 10, "y": 50, "width": 25, "height": 32 } },
    { "id": "user-name", "type": "text", "properties": { "x": 40, "y": 60, "width": 50, "height": 6, "content": "", "fill": "#2D3436", "fontSize": 18, "fontFamily": "Playfair Display", "fontWeight": "500" } },
    { "id": "event-logo", "type": "logo", "properties": { "x": 75, "y": 85, "width": 15, "height": 10 } }
  ]
}

=== EXAMPLE 3 ===
Input Event:
{
  "name": "Startup Week",
  "brandColors": { "primary": "#00B894", "accent": "#FDCB6E" },
  "visualStyle": { "style": "bold", "typography": { "headingStyle": "sans-serif", "weight": "heavy" } }
}

Output Template (bold layout):
{
  "name": "Bold Impact",
  "layout": "bold",
  "backgroundColor": "#00B894",
  "elements": [
    { "id": "event-name", "type": "text", "properties": { "x": 5, "y": 5, "width": 90, "height": 15, "content": "STARTUP WEEK", "fill": "#FFFFFF", "fontSize": 48, "fontFamily": "Montserrat", "fontWeight": "900" } },
    { "id": "attending-badge", "type": "shape", "properties": { "x": 5, "y": 22, "width": 50, "height": 10, "fill": "#FDCB6E", "content": "I'M ATTENDING!", "fontSize": 20, "fontFamily": "Montserrat", "fontWeight": "800" } },
    { "id": "user-photo", "type": "image", "properties": { "x": 25, "y": 38, "width": 50, "height": 50 } },
    { "id": "user-name", "type": "text", "properties": { "x": 5, "y": 90, "width": 90, "height": 6, "content": "", "fill": "#FFFFFF", "fontSize": 22, "fontFamily": "Montserrat", "fontWeight": "700" } },
    { "id": "event-logo", "type": "logo", "properties": { "x": 70, "y": 5, "width": 25, "height": 12 } }
  ]
}
`;

export class TemplateGenerationTemplate extends JsonPromptTemplate<
  TemplateGenerationInput,
  TemplateGenerationOutput
> {
  readonly id = 'template-generation';
  readonly name = 'Poster Template Generator';
  readonly description = 'Generates poster templates based on event data';

  build(input: TemplateGenerationInput): string {
    const layouts = input.layouts ?? ['classic', 'modern', 'minimal', 'bold'];
    const visualStyle = input.eventData.visualStyle;
    const brandColors = input.eventData.brandColors;

    // Build style guidance based on extracted visual style
    let styleGuidance = '';
    if (visualStyle !== undefined) {
      const elements =
        visualStyle.designElements.length > 0
          ? visualStyle.designElements.join(', ')
          : 'none specified';
      styleGuidance = `
Visual Style Guidance (extracted from event website):
- Overall Style: ${visualStyle.style}
- Typography: ${visualStyle.typography.headingStyle} headings, ${visualStyle.typography.weight} weight
- Design Elements to incorporate: ${elements}
`;
    }

    // Build color guidance
    let colorGuidance = '';
    if (brandColors !== undefined) {
      const secondary =
        brandColors.secondary !== undefined
          ? `\n- Secondary: ${brandColors.secondary}`
          : '';
      const accent =
        brandColors.accent !== undefined
          ? `\n- Accent: ${brandColors.accent}`
          : '';
      colorGuidance = `
Brand Colors (use these!):
- Primary: ${brandColors.primary}${secondary}${accent}
`;
    }

    return `
You are an expert poster template designer. Create ${String(input.count)} UNIQUE and VISUALLY DISTINCT "I'm attending" poster templates for this event.

${FEW_SHOT_EXAMPLES}

=== NOW GENERATE FOR THIS EVENT ===

Event Details:
${JSON.stringify(input.eventData, null, 2)}
${styleGuidance}${colorGuidance}

REQUIREMENTS:
1. Create ${String(input.count)} templates, each with a DIFFERENT layout: ${layouts.slice(0, input.count).join(', ')}
2. Each template MUST be visually distinct:
   - Different element positions
   - Different background colors (vary between brand primary, secondary, or contrasting white/dark)
   - Different typography sizes and arrangements
3. Every template MUST include these elements:
   - "event-name" (text): Event title, prominent position
   - "event-date" (text): Date if available
   - "attending-badge" (text or shape): "I'm Attending!" message
   - "user-photo" (image): Placeholder for user photo (id MUST be "user-photo")
   - "user-name" (text): Placeholder for user name
   - "event-logo" (logo): Event logo placeholder (id MUST be "event-logo")
4. Positions use PERCENTAGE coordinates (0-100)
5. Use the brand colors from the event
6. Match the visual style (modern, classic, minimal, bold) to the event's detected style

Layout Guidelines:
- "classic": Centered, balanced, traditional hierarchy (title top, photo center, name bottom)
- "modern": Asymmetric, bold typography, creative element placement
- "minimal": Lots of whitespace, simple, elegant, understated
- "bold": Large typography, strong colors, high impact, uppercase text

IMPORTANT: Respond with ONLY valid JSON in this exact format:
{
  "templates": [
    {
      "name": "Template Name",
      "layout": "classic|modern|minimal|bold",
      "backgroundColor": "#HEXCODE",
      "elements": [
        { "id": "element-id", "type": "text|image|shape|logo", "properties": { "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100, "content": "text", "fill": "#hex", "fontSize": 24, "fontFamily": "Font Name", "fontWeight": "400-900" } }
      ]
    }
  ]
}
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
