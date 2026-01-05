/**
 * AI Provider Interface
 *
 * This is the abstract contract that all AI providers must implement.
 * Swap providers by changing AI_PROVIDER env variable.
 */

/** Gradient definition for backgrounds or elements */
export interface GradientStyle {
  type: 'linear' | 'radial';
  /** Angle in degrees for linear gradients (0 = top to bottom, 90 = left to right) */
  angle?: number;
  /** Color stops */
  colors: string[];
  /** Position of each color stop (0-1), defaults to evenly distributed */
  positions?: number[];
}

/** Shadow definition */
export interface ShadowStyle {
  type: 'soft' | 'hard' | 'glow' | 'none';
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

/** Decorative element found in the design */
export interface DecorativeElement {
  type: 'line' | 'circle' | 'rectangle' | 'blob' | 'dots' | 'grid';
  position:
    | 'top-left'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-right'
    | 'background'
    | 'border';
  color: string;
  opacity: number;
  /** Size relative to canvas (0-100) */
  size?: number;
}

export interface VisualStyle {
  /** Overall design style */
  style: 'modern' | 'classic' | 'minimal' | 'bold' | 'playful' | 'corporate';

  /** Typography characteristics */
  typography: {
    headingStyle: 'sans-serif' | 'serif' | 'display' | 'monospace';
    bodyStyle: 'sans-serif' | 'serif';
    weight: 'light' | 'regular' | 'bold' | 'heavy';
    /** Letter spacing style */
    letterSpacing?: 'tight' | 'normal' | 'wide';
  };

  /** Main gradient used in the design (hero, backgrounds) */
  gradient?: GradientStyle;

  /** Shadow style used on cards/elements */
  shadow?: ShadowStyle;

  /** Decorative elements observed (geometric shapes, patterns) */
  decorativeElements?: DecorativeElement[];

  /** Legacy: design elements as strings */
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
  /** AI-generated background image URL */
  backgroundImageUrl?: string;
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo' | 'gradient-bg' | 'decorative';
  /** Layer order (higher = on top) */
  zIndex?: number;
  properties: {
    /** Position as percentage (0-100) */
    x: number;
    y: number;
    width: number;
    height: number;

    // Text properties
    content?: string;
    fill?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right';

    // Gradient fill (instead of solid fill)
    gradient?: GradientStyle;

    // Shadow on element
    shadow?: ShadowStyle;

    // Shape properties
    shapeType?: 'line' | 'circle' | 'rectangle' | 'rounded-rect' | 'blob';
    borderRadius?: number;
    strokeColor?: string;
    strokeWidth?: number;

    // Opacity (0-1)
    opacity?: number;

    // Rotation in degrees
    rotation?: number;

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

  /**
   * Generate a background image for a poster using AI image generation
   * Returns the URL of the generated image
   */
  generateBackgroundImage(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): Promise<string>;
}

// Injection token for the AI provider
export const AI_PROVIDER = 'AI_PROVIDER';
