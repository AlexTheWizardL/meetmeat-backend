import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { IsNull } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../profiles.service';
import { Profile } from '../entities/profile.entity';
import type { CreateProfileDto } from '../dto/create-profile.dto';

describe('ProfilesService', () => {
  let service: ProfilesService;
  let _repository: jest.Mocked<Repository<Profile>>;

  const mockProfile: Profile = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    title: 'Software Engineer',
    company: 'Tech Corp',
    avatarUrl: 'https://example.com/avatar.jpg',
    socialLinks: [
      { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
    ],
    isDefault: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    deletedAt: undefined,
    version: 1,
  };

  const mockManager = {
    update: jest.fn(),
    save: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softRemove: jest.fn(),
    manager: {
      transaction: jest.fn(
        (cb: (manager: typeof mockManager) => Promise<Profile>) =>
          cb(mockManager),
      ),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: getRepositoryToken(Profile),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    _repository = module.get(getRepositoryToken(Profile));

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new profile with all fields', async () => {
      const createDto: CreateProfileDto = {
        name: 'John Doe',
        title: 'Software Engineer',
        company: 'Tech Corp',
        avatarUrl: 'https://example.com/avatar.jpg',
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/johndoe' },
        ],
        isDefault: true,
      };

      const createdProfile = { ...mockProfile, ...createDto };
      mockRepository.create.mockReturnValue(createdProfile);
      mockRepository.save.mockResolvedValue(createdProfile);

      const result = await service.create(createDto);

      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.name).toBe(createDto.name);
      expect(result.isDefault).toBe(true);
    });

    it('should create profile with default values when optional fields missing', async () => {
      const createDto: CreateProfileDto = {
        name: 'Jane Doe',
        title: 'Designer',
      };

      const createdProfile = {
        ...mockProfile,
        name: createDto.name,
        title: createDto.title,
        socialLinks: [],
        isDefault: false,
      };
      mockRepository.create.mockReturnValue(createdProfile);
      mockRepository.save.mockResolvedValue(createdProfile);

      const result = await service.create(createDto);

      expect(result.socialLinks).toEqual([]);
      expect(result.isDefault).toBe(false);
    });

    it('should handle empty social links array', async () => {
      const createDto: CreateProfileDto = {
        name: 'Test User',
        title: 'Tester',
        socialLinks: [],
      };

      const createdProfile = { ...mockProfile, ...createDto };
      mockRepository.create.mockReturnValue(createdProfile);
      mockRepository.save.mockResolvedValue(createdProfile);

      const result = await service.create(createDto);

      expect(result.socialLinks).toEqual([]);
    });
  });

  describe('findAll', () => {
    it('should return all non-deleted profiles ordered by createdAt DESC', async () => {
      const profiles = [
        mockProfile,
        { ...mockProfile, id: 'another-id', name: 'Jane' },
      ];
      mockRepository.find.mockResolvedValue(profiles);

      const result = await service.findAll();

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { deletedAt: IsNull() },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no profiles exist', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return profile by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);

      const result = await service.findOne(mockProfile.id);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProfile.id, deletedAt: IsNull() },
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should not return soft-deleted profiles', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockProfile.id)).rejects.toThrow(
        NotFoundException,
      );
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockProfile.id, deletedAt: IsNull() },
      });
    });
  });

  describe('findDefault', () => {
    it('should return the default profile', async () => {
      const defaultProfile = { ...mockProfile, isDefault: true };
      mockRepository.findOne.mockResolvedValue(defaultProfile);

      const result = await service.findDefault();

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { isDefault: true, deletedAt: IsNull() },
      });
      expect(result?.isDefault).toBe(true);
    });

    it('should return null when no default profile exists', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findDefault();

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update profile fields', async () => {
      const updateDto = { name: 'Updated Name', title: 'New Title' };
      const updatedProfile = { ...mockProfile, ...updateDto };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.update(mockProfile.id, updateDto);

      expect(result.name).toBe('Updated Name');
      expect(result.title).toBe('New Title');
    });

    it('should throw NotFoundException when updating non-existent profile', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { name: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should preserve unchanged fields', async () => {
      const updateDto = { name: 'Only Name Changed' };
      const updatedProfile = { ...mockProfile, name: updateDto.name };

      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.save.mockResolvedValue(updatedProfile);

      const result = await service.update(mockProfile.id, updateDto);

      expect(result.title).toBe(mockProfile.title);
      expect(result.company).toBe(mockProfile.company);
    });
  });

  describe('remove', () => {
    it('should soft delete profile', async () => {
      mockRepository.findOne.mockResolvedValue(mockProfile);
      mockRepository.softRemove.mockResolvedValue(mockProfile);

      await service.remove(mockProfile.id);

      expect(mockRepository.softRemove).toHaveBeenCalledWith(mockProfile);
    });

    it('should throw NotFoundException when removing non-existent profile', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('setDefault', () => {
    it('should set profile as default and unset others', async () => {
      const profileToSetDefault = { ...mockProfile, isDefault: false };
      const defaultedProfile = { ...profileToSetDefault, isDefault: true };

      mockRepository.findOne.mockResolvedValue(profileToSetDefault);
      mockManager.update.mockResolvedValue({ affected: 1 } as never);
      mockManager.save.mockResolvedValue(defaultedProfile);

      const result = await service.setDefault(mockProfile.id);

      expect(mockManager.update).toHaveBeenCalledWith(
        Profile,
        { isDefault: true, deletedAt: IsNull() },
        { isDefault: false },
      );
      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundException when setting non-existent profile as default', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.setDefault('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should work when profile is already default', async () => {
      const alreadyDefault = { ...mockProfile, isDefault: true };

      mockRepository.findOne.mockResolvedValue(alreadyDefault);
      mockManager.update.mockResolvedValue({ affected: 1 } as never);
      mockManager.save.mockResolvedValue(alreadyDefault);

      const result = await service.setDefault(mockProfile.id);

      expect(result.isDefault).toBe(true);
    });
  });
});
