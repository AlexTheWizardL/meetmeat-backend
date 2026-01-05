import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/** Gradient definition for backgrounds or elements */
export interface GradientStyle {
  type: 'linear' | 'radial';
  angle?: number;
  colors: string[];
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

export interface TemplateElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'logo' | 'gradient-bg' | 'decorative';
  /** Layer order (higher = on top) */
  zIndex?: number;
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    // Text
    content?: string;
    fill?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    letterSpacing?: number;
    textAlign?: 'left' | 'center' | 'right';
    // Gradient & Shadow
    gradient?: GradientStyle;
    shadow?: ShadowStyle;
    // Shape
    shapeType?:
      | 'line'
      | 'circle'
      | 'rectangle'
      | 'rounded-rect'
      | 'blob'
      | 'dots';
    borderRadius?: number;
    strokeColor?: string;
    strokeWidth?: number;
    // General
    opacity?: number;
    rotation?: number;
    [key: string]: unknown;
  };
}

export interface TemplateDesign {
  layout: 'classic' | 'modern' | 'minimal' | 'bold';
  backgroundColor: string;
  elements: TemplateElement[];
}

@Entity('templates')
@Index(['eventId', 'status']) // Composite index for common query pattern
export class Template extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string;

  @Column({ type: 'jsonb' })
  design: TemplateDesign;

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'archived';

  @Index()
  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  eventId?: string;
}
