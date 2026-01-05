import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateBackgroundsDto {
  @ApiProperty({
    description: 'UUID of the event to generate backgrounds for',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  eventId: string;
}

export class GenerateBackgroundsResponseDto {
  @ApiProperty({
    description: 'Background image URL for modern style',
    example: 'https://oaidalleapiprodscus.blob.core.windows.net/...',
  })
  modern: string;

  @ApiProperty({
    description: 'Background image URL for minimal style',
    example: 'https://oaidalleapiprodscus.blob.core.windows.net/...',
  })
  minimal: string;

  @ApiProperty({
    description: 'Background image URL for bold style',
    example: 'https://oaidalleapiprodscus.blob.core.windows.net/...',
  })
  bold: string;
}
