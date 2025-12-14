import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ParseEventDto {
  @ApiProperty({
    description: 'URL of the event page to parse',
    example: 'https://example.com/tech-summit-2025',
  })
  @IsUrl()
  url: string;
}
