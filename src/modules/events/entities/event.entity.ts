import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface EventLocation {
  venue?: string;
  city?: string;
  country?: string;
  isVirtual: boolean;
}

export interface BrandColors {
  primary: string;
  secondary?: string;
}

@Entity('events')
export class Event extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'text', unique: true })
  sourceUrl: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Index()
  @Column({ type: 'date', nullable: true })
  startDate?: Date;

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ type: 'jsonb', nullable: true })
  location?: EventLocation;

  @Column({ type: 'text', nullable: true })
  logoUrl?: string;

  @Column({ type: 'jsonb', nullable: true })
  brandColors?: BrandColors;

  @Column({ type: 'varchar', length: 255, nullable: true })
  organizerName?: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  rawMetadata: Record<string, unknown>;
}
