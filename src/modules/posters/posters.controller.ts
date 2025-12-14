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
} from '@nestjs/common';
import { PostersService } from './posters.service';
import { CreatePosterDto } from './dto/create-poster.dto';
import { UpdatePosterDto } from './dto/update-poster.dto';
import { ExportPosterDto } from './dto/export-poster.dto';
import type { Poster, PosterExport } from './entities/poster.entity';

@Controller('posters')
export class PostersController {
  constructor(private readonly postersService: PostersService) {}

  @Post()
  create(@Body() createPosterDto: CreatePosterDto): Promise<Poster> {
    return this.postersService.create(createPosterDto);
  }

  @Get()
  findAll(@Query('profileId') profileId?: string): Promise<Poster[]> {
    return this.postersService.findAll(profileId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Poster> {
    return this.postersService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePosterDto: UpdatePosterDto,
  ): Promise<Poster> {
    return this.postersService.update(id, updatePosterDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.postersService.remove(id);
  }

  @Post(':id/export')
  export(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() exportDto: ExportPosterDto,
  ): Promise<PosterExport> {
    return this.postersService.export(id, exportDto.platform);
  }
}
