import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  create(@Body() createProfileDto: CreateProfileDto): Promise<Profile> {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  findAll(): Promise<Profile[]> {
    return this.profilesService.findAll();
  }

  @Get('default')
  findDefault(): Promise<Profile | null> {
    return this.profilesService.findDefault();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Profile> {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.profilesService.remove(id);
  }

  @Patch(':id/default')
  setDefault(@Param('id', ParseUUIDPipe) id: string): Promise<Profile> {
    return this.profilesService.setDefault(id);
  }
}
