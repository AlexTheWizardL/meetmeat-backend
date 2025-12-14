import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import type { ExportPlatform } from '../entities/poster.entity';

export class ExportPosterDto {
  @ApiProperty({
    description: 'Target social media platform for export',
    enum: ['linkedin', 'instagram', 'twitter', 'facebook'],
    example: 'linkedin',
  })
  @IsEnum(['linkedin', 'instagram', 'twitter', 'facebook'])
  platform: ExportPlatform;
}
