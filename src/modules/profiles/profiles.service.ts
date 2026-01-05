import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<Profile> {
    const profile = this.profileRepository.create();
    profile.name = createProfileDto.name;
    profile.title = createProfileDto.title;
    profile.company = createProfileDto.company;
    profile.avatarUrl = createProfileDto.avatarUrl;
    profile.socialLinks = createProfileDto.socialLinks ?? [];
    profile.isDefault = createProfileDto.isDefault ?? false;
    return this.profileRepository.save(profile);
  }

  async findAll(): Promise<Profile[]> {
    return this.profileRepository.find({
      where: { deletedAt: IsNull() },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { id, deletedAt: IsNull() },
    });

    if (!profile) {
      throw new NotFoundException(`Profile with ID ${id} not found`);
    }

    return profile;
  }

  async findDefault(): Promise<Profile | null> {
    return this.profileRepository.findOne({
      where: { isDefault: true, deletedAt: IsNull() },
    });
  }

  async update(
    id: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.findOne(id);
    Object.assign(profile, updateProfileDto);
    return this.profileRepository.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.profileRepository.softRemove(profile);
  }

  async setDefault(id: string): Promise<Profile> {
    const profile = await this.findOne(id);

    // Use transaction to prevent race condition
    return this.profileRepository.manager.transaction(async (manager) => {
      // Remove default from all other profiles
      await manager.update(
        Profile,
        { isDefault: true, deletedAt: IsNull() },
        { isDefault: false },
      );

      // Set this profile as default
      profile.isDefault = true;
      return manager.save(profile);
    });
  }
}
