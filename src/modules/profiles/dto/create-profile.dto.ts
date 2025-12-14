import {
  IsString,
  IsOptional,
  IsUrl,
  IsArray,
  ValidateNested,
  IsEnum,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SocialLinkDto {
  @IsEnum(['linkedin', 'twitter', 'instagram', 'facebook', 'website'])
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'website';

  @IsUrl()
  url: string;
}

export class CreateProfileDto {
  @IsString()
  @Length(1, 255)
  name: string;

  @IsString()
  @Length(1, 255)
  title: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  company?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];
}
