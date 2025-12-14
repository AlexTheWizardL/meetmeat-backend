import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateTemplatesDto {
  @ApiProperty({
    description: 'UUID of the event to generate templates for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  eventId: string;

  @ApiPropertyOptional({
    description: 'Number of templates to generate',
    minimum: 1,
    maximum: 5,
    default: 3,
    example: 3,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  count?: number = 3;
}
