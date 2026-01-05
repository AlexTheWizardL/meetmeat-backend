import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { GenerateTemplatesDto } from './dto/generate-templates.dto';
import {
  GenerateBackgroundsDto,
  GenerateBackgroundsResponseDto,
} from './dto/generate-backgrounds.dto';
import { Template } from './entities/template.entity';

@ApiTags('templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate templates for an event',
    description:
      'Uses AI to generate poster templates based on the event details and brand colors.',
  })
  @ApiResponse({
    status: 201,
    description: 'Templates generated successfully',
    type: [Template],
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  generate(@Body() dto: GenerateTemplatesDto): Promise<Template[]> {
    return this.templatesService.generateForEvent(dto.eventId, dto.count);
  }

  @Post('generate-backgrounds')
  @ApiOperation({
    summary: 'Generate AI background images for templates',
    description:
      'Uses DALL-E to generate beautiful abstract background images matching the event brand colors and style.',
  })
  @ApiResponse({
    status: 201,
    description: 'Background images generated successfully',
    type: GenerateBackgroundsResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Event not found' })
  generateBackgrounds(
    @Body() dto: GenerateBackgroundsDto,
  ): Promise<GenerateBackgroundsResponseDto> {
    return this.templatesService.generateBackgrounds(dto.eventId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates' })
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: 'Filter by event UUID',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'List of templates',
    type: [Template],
  })
  findAll(@Query('eventId') eventId?: string): Promise<Template[]> {
    if (eventId !== undefined && eventId !== '') {
      return this.templatesService.findByEvent(eventId);
    }
    return this.templatesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiParam({ name: 'id', description: 'Template UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Template found', type: Template })
  @ApiResponse({ status: 404, description: 'Template not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Template> {
    return this.templatesService.findOne(id);
  }
}
