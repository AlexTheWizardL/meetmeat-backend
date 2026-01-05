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
 * Enhanced with gradients, shadows, and decorative elements to capture visual vibe
 */
const FEW_SHOT_EXAMPLES = `
=== EXAMPLE 1: MODERN TECH (with gradient background + glow) ===
Input Event:
{
  "name": "TechConf 2024",
  "brandColors": { "primary": "#6C5CE7", "secondary": "#A29BFE" },
  "visualStyle": {
    "style": "modern",
    "gradient": { "type": "linear", "angle": 135, "colors": ["#6C5CE7", "#A29BFE"] },
    "shadow": { "type": "glow", "color": "#A29BFE", "blur": 30, "offsetX": 0, "offsetY": 0 }
  }
}

Output Template:
{
  "name": "Gradient Glow",
  "layout": "modern",
  "backgroundColor": "#6C5CE7",
  "elements": [
    { "id": "background-gradient", "type": "gradient-bg", "zIndex": 0, "properties": { "x": 0, "y": 0, "width": 100, "height": 100, "gradient": { "type": "linear", "angle": 135, "colors": ["#6C5CE7", "#A29BFE"] } } },
    { "id": "decorative-circle-1", "type": "decorative", "zIndex": 1, "properties": { "x": -10, "y": -10, "width": 40, "height": 40, "shapeType": "circle", "fill": "#FFFFFF", "opacity": 0.1 } },
    { "id": "decorative-circle-2", "type": "decorative", "zIndex": 1, "properties": { "x": 80, "y": 70, "width": 30, "height": 30, "shapeType": "circle", "fill": "#FFFFFF", "opacity": 0.08 } },
    { "id": "event-name", "type": "text", "zIndex": 10, "properties": { "x": 5, "y": 8, "width": 90, "height": 12, "content": "TechConf 2024", "fill": "#FFFFFF", "fontSize": 42, "fontFamily": "Inter", "fontWeight": "800", "shadow": { "type": "glow", "color": "#A29BFE", "blur": 20, "offsetX": 0, "offsetY": 0 } } },
    { "id": "event-date", "type": "text", "zIndex": 10, "properties": { "x": 5, "y": 22, "width": 90, "height": 6, "content": "March 15-17, 2024", "fill": "#FFFFFF", "fontSize": 20, "fontFamily": "Inter", "fontWeight": "500", "opacity": 0.9 } },
    { "id": "attending-badge", "type": "shape", "zIndex": 10, "properties": { "x": 5, "y": 75, "width": 42, "height": 12, "fill": "#FFFFFF", "borderRadius": 8, "content": "I'm Attending!", "fontSize": 18, "fontFamily": "Inter", "fontWeight": "700", "shadow": { "type": "soft", "color": "#000000", "blur": 15, "offsetX": 0, "offsetY": 5 } } },
    { "id": "user-photo", "type": "image", "zIndex": 10, "properties": { "x": 58, "y": 32, "width": 38, "height": 48, "borderRadius": 12, "shadow": { "type": "soft", "color": "#000000", "blur": 20, "offsetX": 0, "offsetY": 10 } } },
    { "id": "user-name", "type": "text", "zIndex": 10, "properties": { "x": 5, "y": 88, "width": 50, "height": 6, "content": "", "fill": "#FFFFFF", "fontSize": 16, "fontFamily": "Inter", "fontWeight": "600" } },
    { "id": "event-logo", "type": "logo", "zIndex": 10, "properties": { "x": 80, "y": 5, "width": 15, "height": 10 } }
  ]
}

=== EXAMPLE 2: MINIMAL ELEGANT (clean, subtle shadow) ===
Input Event:
{
  "name": "Design Summit",
  "brandColors": { "primary": "#2D3436", "secondary": "#E17055" },
  "visualStyle": {
    "style": "minimal",
    "shadow": { "type": "soft", "color": "#000000", "blur": 20, "offsetX": 0, "offsetY": 8 },
    "decorativeElements": [{ "type": "line", "position": "border", "color": "#E17055" }]
  }
}

Output Template:
{
  "name": "Clean Minimal",
  "layout": "minimal",
  "backgroundColor": "#FAFAFA",
  "elements": [
    { "id": "accent-line", "type": "decorative", "zIndex": 1, "properties": { "x": 0, "y": 0, "width": 100, "height": 1, "shapeType": "rectangle", "fill": "#E17055" } },
    { "id": "event-name", "type": "text", "zIndex": 10, "properties": { "x": 10, "y": 18, "width": 80, "height": 10, "content": "Design Summit", "fill": "#2D3436", "fontSize": 36, "fontFamily": "Playfair Display", "fontWeight": "500", "letterSpacing": 1 } },
    { "id": "event-date", "type": "text", "zIndex": 10, "properties": { "x": 10, "y": 30, "width": 80, "height": 5, "content": "June 20, 2024", "fill": "#636E72", "fontSize": 14, "fontFamily": "Inter", "fontWeight": "400" } },
    { "id": "divider", "type": "shape", "zIndex": 10, "properties": { "x": 10, "y": 38, "width": 15, "height": 0.3, "fill": "#E17055" } },
    { "id": "attending-badge", "type": "text", "zIndex": 10, "properties": { "x": 10, "y": 44, "width": 80, "height": 6, "content": "I'm Attending", "fill": "#2D3436", "fontSize": 16, "fontFamily": "Inter", "fontWeight": "500" } },
    { "id": "user-photo", "type": "image", "zIndex": 10, "properties": { "x": 10, "y": 54, "width": 28, "height": 35, "borderRadius": 4, "shadow": { "type": "soft", "color": "#000000", "blur": 15, "offsetX": 0, "offsetY": 6 } } },
    { "id": "user-name", "type": "text", "zIndex": 10, "properties": { "x": 44, "y": 65, "width": 46, "height": 6, "content": "", "fill": "#2D3436", "fontSize": 18, "fontFamily": "Playfair Display", "fontWeight": "500" } },
    { "id": "event-logo", "type": "logo", "zIndex": 10, "properties": { "x": 78, "y": 85, "width": 12, "height": 8 } }
  ]
}

=== EXAMPLE 3: BOLD PLAYFUL (strong colors, hard shadows, shapes) ===
Input Event:
{
  "name": "Startup Week",
  "brandColors": { "primary": "#00B894", "accent": "#FDCB6E" },
  "visualStyle": {
    "style": "bold",
    "shadow": { "type": "hard", "color": "#000000", "blur": 0, "offsetX": 4, "offsetY": 4 },
    "decorativeElements": [{ "type": "rectangle", "position": "background", "color": "#FDCB6E", "opacity": 0.3 }]
  }
}

Output Template:
{
  "name": "Bold Impact",
  "layout": "bold",
  "backgroundColor": "#00B894",
  "elements": [
    { "id": "decorative-block", "type": "decorative", "zIndex": 1, "properties": { "x": 60, "y": 0, "width": 40, "height": 100, "shapeType": "rectangle", "fill": "#FDCB6E", "opacity": 0.25 } },
    { "id": "decorative-dots", "type": "decorative", "zIndex": 1, "properties": { "x": 85, "y": 75, "width": 12, "height": 20, "shapeType": "dots", "fill": "#FFFFFF", "opacity": 0.3 } },
    { "id": "event-name", "type": "text", "zIndex": 10, "properties": { "x": 5, "y": 5, "width": 55, "height": 18, "content": "STARTUP WEEK", "fill": "#FFFFFF", "fontSize": 44, "fontFamily": "Montserrat", "fontWeight": "900", "shadow": { "type": "hard", "color": "#000000", "blur": 0, "offsetX": 3, "offsetY": 3 } } },
    { "id": "attending-badge", "type": "shape", "zIndex": 10, "properties": { "x": 5, "y": 26, "width": 48, "height": 10, "fill": "#FDCB6E", "content": "I'M ATTENDING!", "fontSize": 18, "fontFamily": "Montserrat", "fontWeight": "800", "shadow": { "type": "hard", "color": "#000000", "blur": 0, "offsetX": 3, "offsetY": 3 } } },
    { "id": "user-photo", "type": "image", "zIndex": 10, "properties": { "x": 5, "y": 42, "width": 45, "height": 48, "borderRadius": 0, "shadow": { "type": "hard", "color": "#000000", "blur": 0, "offsetX": 5, "offsetY": 5 } } },
    { "id": "user-name", "type": "text", "zIndex": 10, "properties": { "x": 55, "y": 50, "width": 40, "height": 8, "content": "", "fill": "#FFFFFF", "fontSize": 20, "fontFamily": "Montserrat", "fontWeight": "700" } },
    { "id": "event-logo", "type": "logo", "zIndex": 10, "properties": { "x": 55, "y": 65, "width": 20, "height": 14 } }
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

    // Build comprehensive style guidance from extracted visual style
    let styleGuidance = '';
    if (visualStyle !== undefined) {
      const elements =
        visualStyle.designElements.length > 0
          ? visualStyle.designElements.join(', ')
          : 'none specified';

      // Gradient info
      let gradientInfo = 'No gradient detected';
      if (visualStyle.gradient) {
        const g = visualStyle.gradient;
        gradientInfo = `${g.type} gradient at ${String(g.angle ?? 0)}°, colors: ${g.colors.join(' → ')}`;
      }

      // Shadow info
      let shadowInfo = 'No shadow style detected';
      if (visualStyle.shadow) {
        const s = visualStyle.shadow;
        shadowInfo = `${s.type} shadow (blur: ${String(s.blur)}, offset: ${String(s.offsetX)},${String(s.offsetY)}, color: ${s.color})`;
      }

      // Decorative elements
      let decorativeInfo = 'No decorative elements';
      if (
        visualStyle.decorativeElements &&
        visualStyle.decorativeElements.length > 0
      ) {
        decorativeInfo = visualStyle.decorativeElements
          .map(
            (d) =>
              `${d.type} at ${d.position} (${d.color}, opacity: ${String(d.opacity)})`,
          )
          .join('; ');
      }

      styleGuidance = `
=== VISUAL VIBE TO CAPTURE ===
The event website has this visual language. APPLY these styles to the templates:

Overall Style: ${visualStyle.style}
Typography: ${visualStyle.typography.headingStyle} headings, ${visualStyle.typography.weight} weight${visualStyle.typography.letterSpacing ? `, ${visualStyle.typography.letterSpacing} spacing` : ''}

GRADIENT: ${gradientInfo}
→ If gradient detected, use "gradient-bg" element as background layer (zIndex: 0)

SHADOWS: ${shadowInfo}
→ Apply this shadow style to cards, photos, and badges

DECORATIVE ELEMENTS: ${decorativeInfo}
→ Add similar decorative shapes to match the event's aesthetic

Design Elements: ${elements}
`;
    }

    // Build color guidance
    let colorGuidance = '';
    if (brandColors !== undefined) {
      const colors = [
        `Primary: ${brandColors.primary}`,
        brandColors.secondary !== undefined
          ? `Secondary: ${brandColors.secondary}`
          : null,
        brandColors.accent !== undefined
          ? `Accent: ${brandColors.accent}`
          : null,
        brandColors.background !== undefined
          ? `Background: ${brandColors.background}`
          : null,
      ]
        .filter(Boolean)
        .join('\n- ');
      colorGuidance = `
Brand Colors (USE THESE!):
- ${colors}
`;
    }

    return `
You are an expert poster designer. Create ${String(input.count)} UNIQUE "I'm attending" poster templates that CAPTURE THE VISUAL VIBE of this event.

${FEW_SHOT_EXAMPLES}

=== NOW GENERATE FOR THIS EVENT ===

Event Details:
${JSON.stringify(input.eventData, null, 2)}
${styleGuidance}${colorGuidance}

REQUIREMENTS:

1. CREATE ${String(input.count)} VISUALLY DISTINCT TEMPLATES
   Each template should have a different layout: ${layouts.slice(0, input.count).join(', ')}

2. APPLY THE VISUAL VIBE:
   - If gradient was detected → Add a "gradient-bg" element as background (zIndex: 0)
   - Apply the detected shadow style to user-photo, badges, and cards
   - Include decorative elements (circles, lines, shapes) matching the event's aesthetic
   - Use the detected typography style (font weight, letter spacing)

3. REQUIRED ELEMENTS (every template must have):
   - "event-name" (text): Event title
   - "event-date" (text): Date
   - "attending-badge" (text/shape): "I'm Attending!" message
   - "user-photo" (image): id MUST be "user-photo"
   - "user-name" (text): Placeholder for user name
   - "event-logo" (logo): id MUST be "event-logo"

4. ELEMENT TYPES:
   - "gradient-bg": Full-width gradient background (x:0, y:0, width:100, height:100)
   - "decorative": Shapes, lines, circles for visual interest
   - "text": Text content with optional shadow/gradient
   - "shape": Badges, buttons with borderRadius
   - "image": User photo placeholder
   - "logo": Event logo

5. LAYER ORDER (zIndex):
   - 0: Background gradients
   - 1-5: Decorative elements
   - 10+: Content (text, photos, logos)

6. Positions use PERCENTAGE (0-100)

RESPOND WITH ONLY VALID JSON:
{
  "templates": [
    {
      "name": "Template Name",
      "layout": "classic|modern|minimal|bold",
      "backgroundColor": "#HEXCODE",
      "elements": [
        {
          "id": "element-id",
          "type": "text|image|shape|logo|gradient-bg|decorative",
          "zIndex": 0,
          "properties": {
            "x": 0-100, "y": 0-100, "width": 0-100, "height": 0-100,
            "content": "text",
            "fill": "#hex",
            "fontSize": 24,
            "fontFamily": "Font Name",
            "fontWeight": "400-900",
            "opacity": 0-1,
            "borderRadius": 0-50,
            "gradient": { "type": "linear|radial", "angle": 0-360, "colors": ["#hex", "#hex"] },
            "shadow": { "type": "soft|hard|glow", "color": "#hex", "blur": 0-50, "offsetX": 0-20, "offsetY": 0-20 }
          }
        }
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

export const templateGenerationTemplate = new TemplateGenerationTemplate();
