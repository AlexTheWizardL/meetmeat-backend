import {
  IsUUID,
  IsOptional,
  IsString,
  IsDateString,
  IsHexColor,
  ValidateNested,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PosterCustomizationDto {
  @ApiPropertyOptional({
    description: 'Custom background color',
    example: '#FFFFFF',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @ApiPropertyOptional({
    description: 'Custom text color',
    example: '#1A1A2E',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @ApiPropertyOptional({
    description: 'Element-specific property overrides',
    example: { 'event-name': { fontSize: 28 } },
  })
  @IsOptional()
  elementOverrides?: Record<string, Record<string, unknown>>;
}

export class CreatePosterDto {
  @ApiProperty({
    description: 'UUID of the profile to use',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  profileId: string;

  @ApiPropertyOptional({
    description: 'UUID of the parsed event (for AI-generated posters)',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsOptional()
  @IsUUID()
  eventId?: string;

  @ApiPropertyOptional({
    description: 'UUID of the template to use',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174002',
  })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({
    description: 'Manual event name (when not using AI parsing)',
    example: 'Tech Summit 2025',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  manualEventName?: string;

  @ApiPropertyOptional({
    description: 'Manual event date (ISO 8601 format)',
    example: '2025-06-15',
  })
  @IsOptional()
  @IsDateString()
  manualEventDate?: string;

  @ApiPropertyOptional({
    description: 'Manual event location',
    example: 'San Francisco, CA',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  manualEventLocation?: string;

  @ApiPropertyOptional({
    description: 'Manual brand color (for custom posters)',
    example: '#6C5CE7',
    pattern: '^#[0-9A-Fa-f]{6}$',
  })
  @IsOptional()
  @IsHexColor()
  manualBrandColor?: string;

  @ApiPropertyOptional({
    description: 'Visual customizations for the poster',
    type: PosterCustomizationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PosterCustomizationDto)
  customizations?: PosterCustomizationDto;
}
