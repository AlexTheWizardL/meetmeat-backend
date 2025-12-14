import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateTemplatesDto {
  @IsUUID()
  eventId: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  count?: number = 3;
}
