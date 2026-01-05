export interface GradientStyle {
  type: 'linear' | 'radial';
  angle?: number;
  colors: string[];
  positions?: number[];
}

export interface ShadowStyle {
  type: 'soft' | 'hard' | 'glow' | 'none';
  color: string;
  blur: number;
  offsetX: number;
  offsetY: number;
}

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
  size?: number;
}

export interface VisualStyle {
  style: 'modern' | 'classic' | 'minimal' | 'bold' | 'playful' | 'corporate';

  typography: {
    headingStyle: 'sans-serif' | 'serif' | 'display' | 'monospace';
    bodyStyle: 'sans-serif' | 'serif';
    weight: 'light' | 'regular' | 'bold' | 'heavy';
    letterSpacing?: 'tight' | 'normal' | 'wide';
  };

  gradient?: GradientStyle;
  shadow?: ShadowStyle;
  decorativeElements?: DecorativeElement[];
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
  visualStyle?: VisualStyle;
  heroImageUrl?: string;
}

export interface GeneratedTemplate {
  name: string;
  layout: 'classic' | 'modern' | 'minimal' | 'bold';
  backgroundColor: string;
  backgroundImageUrl?: string;
  elements: TemplateElement[];
}

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo' | 'gradient-bg' | 'decorative';
  zIndex?: number;
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
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right';

    gradient?: GradientStyle;
    shadow?: ShadowStyle;

    shapeType?: 'line' | 'circle' | 'rectangle' | 'rounded-rect' | 'blob';
    borderRadius?: number;
    strokeColor?: string;
    strokeWidth?: number;

    opacity?: number;
    rotation?: number;

    [key: string]: unknown;
  };
}

export interface AiProviderInterface {
  parseEventFromUrl(url: string): Promise<ParsedEventData>;
  generateTemplates(
    eventData: ParsedEventData,
    count?: number,
  ): Promise<GeneratedTemplate[]>;
  generateBackgroundImage(
    eventData: ParsedEventData,
    style: 'modern' | 'minimal' | 'bold',
  ): Promise<string>;
}

export const AI_PROVIDER = 'AI_PROVIDER';
