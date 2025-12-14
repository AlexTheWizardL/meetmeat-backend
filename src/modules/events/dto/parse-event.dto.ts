import { IsUrl } from 'class-validator';

export class ParseEventDto {
  @IsUrl()
  url: string;
}
