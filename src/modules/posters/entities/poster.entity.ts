import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Profile } from '../../profiles/entities/profile.entity';
import { Event } from '../../events/entities/event.entity';
import { Template } from '../../templates/entities/template.entity';

export type PosterStatus = 'draft' | 'completed' | 'archived';
export type ExportPlatform = 'linkedin' | 'instagram' | 'twitter' | 'facebook';

export interface PosterCustomization {
  backgroundColor?: string;
  textColor?: string;
  elementOverrides?: Record<string, Record<string, unknown>>;
}

export interface PosterExport {
  platform: ExportPlatform;
  width: number;
  height: number;
  imageUrl: string;
  exportedAt: Date;
}

@Entity('posters')
@Index(['profileId', 'status']) // Composite index for user poster listing
export class Poster extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  profileId: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  eventId?: string;

  @Index()
  @Column({ type: 'uuid', nullable: true })
  templateId?: string;

  @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @ManyToOne(() => Event, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'event_id' })
  event?: Event;

  @ManyToOne(() => Template, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'template_id' })
  template?: Template;

  // Manual event entry fallback
  @Column({ type: 'varchar', length: 255, nullable: true })
  manualEventName?: string;

  @Column({ type: 'date', nullable: true })
  manualEventDate?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  manualEventLocation?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  manualBrandColor?: string;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  customizations: PosterCustomization;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  exports: PosterExport[];

  @Index()
  @Column({ type: 'varchar', length: 50, default: 'draft' })
  status: PosterStatus;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;
}
