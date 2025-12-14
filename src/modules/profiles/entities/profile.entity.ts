import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export interface SocialLink {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'website';
  url: string;
}

@Entity('profiles')
export class Profile extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company?: string;

  @Column({ type: 'text', nullable: true })
  avatarUrl?: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  socialLinks: SocialLink[];

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;

  // Relation will be added when Poster entity is created
  // @OneToMany(() => Poster, (poster) => poster.profile)
  // posters: Poster[];
}
