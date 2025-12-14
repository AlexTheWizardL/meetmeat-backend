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

export class PosterCustomizationDto {
  @IsOptional()
  @IsHexColor()
  backgroundColor?: string;

  @IsOptional()
  @IsHexColor()
  textColor?: string;

  @IsOptional()
  elementOverrides?: Record<string, Record<string, unknown>>;
}

export class CreatePosterDto {
  @IsUUID()
  profileId: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  @IsUUID()
  templateId?: string;

  // Manual event entry
  @IsOptional()
  @IsString()
  @Length(1, 255)
  manualEventName?: string;

  @IsOptional()
  @IsDateString()
  manualEventDate?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  manualEventLocation?: string;

  @IsOptional()
  @IsHexColor()
  manualBrandColor?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => PosterCustomizationDto)
  customizations?: PosterCustomizationDto;
}
