import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PostersService } from './posters.service';
import { CreatePosterDto } from './dto/create-poster.dto';
import { UpdatePosterDto } from './dto/update-poster.dto';
import { ExportPosterDto } from './dto/export-poster.dto';
import type { Poster, PosterExport } from './entities/poster.entity';

@ApiTags('posters')
@Controller('posters')
export class PostersController {
  constructor(private readonly postersService: PostersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new poster',
    description:
      'Create a poster using a profile, optionally with an AI-parsed event and template, or manual event details.',
  })
  @ApiResponse({ status: 201, description: 'Poster created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({
    status: 404,
    description: 'Profile, event, or template not found',
  })
  create(@Body() createPosterDto: CreatePosterDto): Promise<Poster> {
    return this.postersService.create(createPosterDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all posters' })
  @ApiQuery({
    name: 'profileId',
    required: false,
    description: 'Filter by profile UUID',
    format: 'uuid',
  })
  @ApiResponse({ status: 200, description: 'List of posters' })
  findAll(@Query('profileId') profileId?: string): Promise<Poster[]> {
    return this.postersService.findAll(profileId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get poster by ID' })
  @ApiParam({ name: 'id', description: 'Poster UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Poster found' })
  @ApiResponse({ status: 404, description: 'Poster not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Poster> {
    return this.postersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update poster' })
  @ApiParam({ name: 'id', description: 'Poster UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Poster updated' })
  @ApiResponse({ status: 404, description: 'Poster not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePosterDto: UpdatePosterDto,
  ): Promise<Poster> {
    return this.postersService.update(id, updatePosterDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete poster (soft delete)' })
  @ApiParam({ name: 'id', description: 'Poster UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Poster deleted' })
  @ApiResponse({ status: 404, description: 'Poster not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.postersService.remove(id);
  }

  @Post(':id/export')
  @ApiOperation({
    summary: 'Export poster for social media',
    description:
      'Generate an optimized image for the specified social media platform.',
  })
  @ApiParam({ name: 'id', description: 'Poster UUID', format: 'uuid' })
  @ApiResponse({ status: 201, description: 'Export created successfully' })
  @ApiResponse({ status: 404, description: 'Poster not found' })
  export(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() exportDto: ExportPosterDto,
  ): Promise<PosterExport> {
    return this.postersService.export(id, exportDto.platform);
  }
}
