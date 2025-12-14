import { PartialType } from '@nestjs/swagger';
import { CreatePosterDto } from './create-poster.dto';
import { IsEnum, IsOptional } from 'class-validator';
import type { PosterStatus } from '../entities/poster.entity';

export class UpdatePosterDto extends PartialType(CreatePosterDto) {
  @IsOptional()
  @IsEnum(['draft', 'completed', 'archived'])
  status?: PosterStatus;
}
