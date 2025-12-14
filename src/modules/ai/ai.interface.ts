/**
 * AI Provider Interface
 *
 * This is the abstract contract that all AI providers must implement.
 * Swap providers by changing AI_PROVIDER env variable.
 */

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
  brandColors?: {
    primary: string;
    secondary?: string;
  };
  logoUrl?: string;
  organizerName?: string;
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
