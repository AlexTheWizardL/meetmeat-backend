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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SocialLinkDto {
  @ApiProperty({
    description: 'Social media platform',
    enum: ['linkedin', 'twitter', 'instagram', 'facebook', 'website'],
    example: 'linkedin',
  })
  @IsEnum(['linkedin', 'twitter', 'instagram', 'facebook', 'website'])
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook' | 'website';

  @ApiProperty({
    description: 'Profile URL on the platform',
    example: 'https://linkedin.com/in/johndoe',
  })
  @IsUrl()
  url: string;
}

export class CreateProfileDto {
  @ApiProperty({
    description: 'Full name of the user',
    example: 'John Doe',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Professional title',
    example: 'Senior Software Engineer',
    minLength: 1,
    maxLength: 255,
  })
  @IsString()
  @Length(1, 255)
  title: string;

  @ApiPropertyOptional({
    description: 'Company or organization name',
    example: 'Tech Corp',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @Length(0, 255)
  company?: string;

  @ApiPropertyOptional({
    description: 'URL to avatar image',
    example: 'https://example.com/avatar.jpg',
  })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Social media profile links',
    type: [SocialLinkDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SocialLinkDto)
  socialLinks?: SocialLinkDto[];

  @ApiPropertyOptional({
    description: 'Set as default profile for poster creation',
    default: false,
  })
  @IsOptional()
  isDefault?: boolean;
}
