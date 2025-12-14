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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Profile } from './entities/profile.entity';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({
    status: 201,
    description: 'Profile created successfully',
    type: Profile,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  create(@Body() createProfileDto: CreateProfileDto): Promise<Profile> {
    return this.profilesService.create(createProfileDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all profiles' })
  @ApiResponse({
    status: 200,
    description: 'List of profiles',
    type: [Profile],
  })
  findAll(): Promise<Profile[]> {
    return this.profilesService.findAll();
  }

  @Get('default')
  @ApiOperation({ summary: 'Get the default profile' })
  @ApiResponse({ status: 200, description: 'Default profile', type: Profile })
  @ApiResponse({
    status: 200,
    description: 'No default profile set (returns null)',
  })
  findDefault(): Promise<Profile | null> {
    return this.profilesService.findDefault();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get profile by ID' })
  @ApiParam({ name: 'id', description: 'Profile UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Profile found', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Profile> {
    return this.profilesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update profile' })
  @ApiParam({ name: 'id', description: 'Profile UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Profile updated', type: Profile })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.profilesService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete profile (soft delete)' })
  @ApiParam({ name: 'id', description: 'Profile UUID', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Profile deleted' })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.profilesService.remove(id);
  }

  @Patch(':id/default')
  @ApiOperation({ summary: 'Set profile as default' })
  @ApiParam({ name: 'id', description: 'Profile UUID', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Profile set as default',
    type: Profile,
  })
  @ApiResponse({ status: 404, description: 'Profile not found' })
  setDefault(@Param('id', ParseUUIDPipe) id: string): Promise<Profile> {
    return this.profilesService.setDefault(id);
  }
}
