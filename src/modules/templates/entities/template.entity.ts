import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

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

export interface TemplateDesign {
  layout: 'classic' | 'modern' | 'minimal' | 'bold';
  backgroundColor: string;
  elements: TemplateElement[];
}

@Entity('templates')
export class Template extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  previewImageUrl?: string;

  @Column({ type: 'jsonb' })
  design: TemplateDesign;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: 'active' | 'archived';

  @Column({ type: 'integer', default: 0 })
  usageCount: number;

  @Column({ type: 'uuid', nullable: true })
  eventId?: string;
}
