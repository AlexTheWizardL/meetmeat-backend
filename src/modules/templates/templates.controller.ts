import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { GenerateTemplatesDto } from './dto/generate-templates.dto';
import { Template } from './entities/template.entity';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('generate')
  generate(@Body() dto: GenerateTemplatesDto): Promise<Template[]> {
    return this.templatesService.generateForEvent(dto.eventId, dto.count);
  }

  @Get()
  findAll(@Query('eventId') eventId?: string): Promise<Template[]> {
    if (eventId !== undefined && eventId !== '') {
      return this.templatesService.findByEvent(eventId);
    }
    return this.templatesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Template> {
    return this.templatesService.findOne(id);
  }
}
