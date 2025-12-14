import { IsEnum } from 'class-validator';
import type { ExportPlatform } from '../entities/poster.entity';

export class ExportPosterDto {
  @IsEnum(['linkedin', 'instagram', 'twitter', 'facebook'])
  platform: ExportPlatform;
}
