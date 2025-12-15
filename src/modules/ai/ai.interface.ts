/**
 * AI Provider Interface
 *
 * This is the abstract contract that all AI providers must implement.
 * Swap providers by changing AI_PROVIDER env variable.
 */

export interface VisualStyle {
  /** Overall design style */
  style: 'modern' | 'classic' | 'minimal' | 'bold' | 'playful' | 'corporate';
  /** Typography characteristics */
  typography: {
    headingStyle: 'sans-serif' | 'serif' | 'display' | 'monospace';
    bodyStyle: 'sans-serif' | 'serif';
    weight: 'light' | 'regular' | 'bold' | 'heavy';
  };
  /** Design elements observed */
  designElements: string[];
}

export interface BrandColors {
  primary: string;
  secondary?: string;
  accent?: string;
  background?: string;
  text?: string;
}

export interface ParsedEventData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: {
    venue?: string;
    city?: string;
    country?: string;
    isVirtual: boolean;
  };
  brandColors?: BrandColors;
  logoUrl?: string;
  organizerName?: string;
  /** Visual style extracted from the page */
  visualStyle?: VisualStyle;
  /** Background image or hero image URL */
  heroImageUrl?: string;
}

export interface GeneratedTemplate {
  name: string;
  layout: 'classic' | 'modern' | 'minimal' | 'bold';
  backgroundColor: string;
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo';
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    content?: string;
    fill?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    [key: string]: unknown;
  };
}

export interface AiProviderInterface {
  /**
   * Parse event information from a URL
   */
  parseEventFromUrl(url: string): Promise<ParsedEventData>;

  /**
   * Generate poster templates based on event data
   */
  generateTemplates(
    eventData: ParsedEventData,
    count?: number,
  ): Promise<GeneratedTemplate[]>;
}

// Injection token for the AI provider
export const AI_PROVIDER = 'AI_PROVIDER';
