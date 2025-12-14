import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProfilesModule } from '../src/modules/profiles/profiles.module';
import { Profile } from '../src/modules/profiles/entities/profile.entity';

describe('ProfilesController (e2e)', () => {
  let app: INestApplication<App>;

  const mockProfiles: Profile[] = [];
  let profileIdCounter = 0;

  const mockRepository = {
    // create() returns an empty object that will be populated by service
    create: jest.fn(() => ({
      id: `profile-${String(++profileIdCounter)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    })),
    save: jest.fn((profile) => {
      if (Array.isArray(profile)) {
        mockProfiles.push(...profile);
        return Promise.resolve(profile);
      }
      const existing = mockProfiles.findIndex((p) => p.id === profile.id);
      if (existing >= 0) {
        mockProfiles[existing] = profile;
      } else {
        mockProfiles.push(profile);
      }
      return Promise.resolve(profile);
    }),
    find: jest.fn(() =>
      Promise.resolve(mockProfiles.filter((p) => !p.deletedAt)),
    ),
    findOne: jest.fn(({ where }) => {
      if (where.isDefault === true) {
        return Promise.resolve(
          mockProfiles.find((p) => p.isDefault && !p.deletedAt) ?? null,
        );
      }
      return Promise.resolve(
        mockProfiles.find((p) => p.id === where.id && !p.deletedAt) ?? null,
      );
    }),
    update: jest.fn(() => Promise.resolve({ affected: 1 })),
    softRemove: jest.fn((profile) => {
      profile.deletedAt = new Date();
      return Promise.resolve(profile);
    }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [ProfilesModule],
    })
      .overrideProvider(getRepositoryToken(Profile))
      .useValue(mockRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  beforeEach(() => {
    mockProfiles.length = 0;
    profileIdCounter = 0;
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /profiles', () => {
    it('should create a profile with required fields', async () => {
      const createDto = {
        name: 'John Doe',
        title: 'Software Engineer',
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'John Doe',
        title: 'Software Engineer',
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create a profile with all fields', async () => {
      const createDto = {
        name: 'Jane Smith',
        title: 'Product Manager',
        company: 'Tech Corp',
        avatarUrl: 'https://example.com/avatar.jpg',
        socialLinks: [
          { platform: 'linkedin', url: 'https://linkedin.com/in/janesmith' },
        ],
        isDefault: true,
      };

      const response = await request(app.getHttpServer())
        .post('/profiles')
        .send(createDto)
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'Jane Smith',
        title: 'Product Manager',
        company: 'Tech Corp',
        isDefault: true,
      });
    });

    it('should reject invalid data', async () => {
      await request(app.getHttpServer())
        .post('/profiles')
        .send({ name: '' }) // Missing title
        .expect(400);
    });

    it('should reject invalid social link platform', async () => {
      const createDto = {
        name: 'Test User',
        title: 'Tester',
        socialLinks: [{ platform: 'invalid', url: 'https://example.com' }],
      };

      await request(app.getHttpServer())
        .post('/profiles')
        .send(createDto)
        .expect(400);
    });

    it('should reject invalid URL in socialLinks', async () => {
      const createDto = {
        name: 'Test User',
        title: 'Tester',
        socialLinks: [{ platform: 'linkedin', url: 'not-a-url' }],
      };

      await request(app.getHttpServer())
        .post('/profiles')
        .send(createDto)
        .expect(400);
    });
  });

  describe('GET /profiles', () => {
    it('should return empty array when no profiles exist', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return all profiles', async () => {
      // Create profiles first
      mockProfiles.push(
        {
          id: 'profile-1',
          name: 'User 1',
          title: 'Title 1',
          socialLinks: [],
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
        {
          id: 'profile-2',
          name: 'User 2',
          title: 'Title 2',
          socialLinks: [],
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
        },
      );

      const response = await request(app.getHttpServer())
        .get('/profiles')
        .expect(200);

      expect(response.body).toHaveLength(2);
    });
  });

  describe('GET /profiles/default', () => {
    it('should return empty when no default profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/profiles/default')
        .expect(200);

      // NestJS returns empty body for null, which supertest parses as {}
      expect(Object.keys(response.body)).toHaveLength(0);
    });

    it('should return the default profile', async () => {
      mockProfiles.push({
        id: 'profile-1',
        name: 'Default User',
        title: 'Default Title',
        socialLinks: [],
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get('/profiles/default')
        .expect(200);

      expect(response.body.isDefault).toBe(true);
    });
  });

  describe('GET /profiles/:id', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should return profile by id', async () => {
      mockProfiles.push({
        id: validUuid,
        name: 'Test User',
        title: 'Test Title',
        socialLinks: [],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .get(`/profiles/${validUuid}`)
        .expect(200);

      expect(response.body.name).toBe('Test User');
    });

    it('should return 404 for non-existent profile', async () => {
      await request(app.getHttpServer())
        .get('/profiles/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });

    it('should return 400 for invalid UUID format', async () => {
      await request(app.getHttpServer())
        .get('/profiles/not-a-uuid')
        .expect(400);
    });
  });

  describe('PATCH /profiles/:id', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174001';

    it('should update profile fields', async () => {
      const profile = {
        id: validUuid,
        name: 'Original Name',
        title: 'Original Title',
        socialLinks: [],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      };
      mockProfiles.push(profile);

      const response = await request(app.getHttpServer())
        .patch(`/profiles/${validUuid}`)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /profiles/:id', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174002';

    it('should soft delete profile', async () => {
      mockProfiles.push({
        id: validUuid,
        name: 'To Delete',
        title: 'Delete Me',
        socialLinks: [],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      await request(app.getHttpServer())
        .delete(`/profiles/${validUuid}`)
        .expect(204);
    });
  });

  describe('PATCH /profiles/:id/default', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174003';

    it('should set profile as default', async () => {
      mockProfiles.push({
        id: validUuid,
        name: 'New Default',
        title: 'Default Title',
        socialLinks: [],
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
      });

      const response = await request(app.getHttpServer())
        .patch(`/profiles/${validUuid}/default`)
        .expect(200);

      expect(response.body.isDefault).toBe(true);
    });
  });
});
