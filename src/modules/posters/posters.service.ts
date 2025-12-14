import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Poster, ExportPlatform, PosterExport } from './entities/poster.entity';
import { CreatePosterDto } from './dto/create-poster.dto';
import { UpdatePosterDto } from './dto/update-poster.dto';
import { STORAGE_PROVIDER } from '../storage/storage.interface';
import type { StorageProviderInterface } from '../storage/storage.interface';

const PLATFORM_DIMENSIONS: Record<
  ExportPlatform,
  { width: number; height: number }
> = {
  linkedin: { width: 1200, height: 627 },
  instagram: { width: 1080, height: 1080 },
  twitter: { width: 1200, height: 675 },
  facebook: { width: 1200, height: 630 },
};

@Injectable()
export class PostersService {
  constructor(
    @InjectRepository(Poster)
    private readonly posterRepository: Repository<Poster>,
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProviderInterface,
  ) {}

  async create(createPosterDto: CreatePosterDto): Promise<Poster> {
    const poster = this.posterRepository.create();
    poster.profileId = createPosterDto.profileId;
    poster.eventId = createPosterDto.eventId;
    poster.templateId = createPosterDto.templateId;
    poster.manualEventName = createPosterDto.manualEventName;
    poster.customizations = createPosterDto.customizations ?? {};
    poster.exports = [];
    poster.status = 'draft';
    return this.posterRepository.save(poster);
  }

  async findAll(profileId?: string): Promise<Poster[]> {
    const where: Record<string, unknown> = { deletedAt: IsNull() };
    if (profileId !== undefined && profileId !== '') {
      where.profileId = profileId;
    }

    return this.posterRepository.find({
      where,
      relations: ['profile', 'event', 'template'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Poster> {
    const poster = await this.posterRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['profile', 'event', 'template'],
    });

    if (!poster) {
      throw new NotFoundException(`Poster with ID ${id} not found`);
    }

    return poster;
  }

  async update(id: string, updatePosterDto: UpdatePosterDto): Promise<Poster> {
    const poster = await this.findOne(id);
    Object.assign(poster, updatePosterDto);
    return this.posterRepository.save(poster);
  }

  async remove(id: string): Promise<void> {
    const poster = await this.findOne(id);
    await this.posterRepository.softRemove(poster);
  }

  async export(id: string, platform: ExportPlatform): Promise<PosterExport> {
    const poster = await this.findOne(id);
    const dimensions = PLATFORM_DIMENSIONS[platform];

    // Generate image (placeholder - actual implementation would use canvas/skia)
    const imageBuffer = this.generatePosterImage(poster, dimensions);

    // Upload to storage
    const uploadResult = await this.storageProvider.upload(imageBuffer, {
      folder: `posters/${poster.id}/exports`,
      filename: `${platform}-${String(Date.now())}.png`,
      mimeType: 'image/png',
      public: true,
    });

    const exportRecord: PosterExport = {
      platform,
      width: dimensions.width,
      height: dimensions.height,
      imageUrl: uploadResult.url,
      exportedAt: new Date(),
    };

    poster.exports.push(exportRecord);
    poster.status = 'completed';
    await this.posterRepository.save(poster);

    return exportRecord;
  }

  async updateThumbnail(id: string, imageBuffer: Buffer): Promise<Poster> {
    const poster = await this.findOne(id);

    const uploadResult = await this.storageProvider.upload(imageBuffer, {
      folder: `posters/${poster.id}`,
      filename: 'thumbnail.png',
      mimeType: 'image/png',
      public: true,
    });

    poster.thumbnailUrl = uploadResult.url;
    return this.posterRepository.save(poster);
  }

  private generatePosterImage(
    poster: Poster,
    dimensions: { width: number; height: number },
  ): Buffer {
    // Placeholder - actual implementation would render the poster
    // using canvas/skia based on template and customizations
    const bgColor =
      ((poster.customizations as Record<string, unknown>).backgroundColor as
        | string
        | undefined) ?? '#6C5CE7';
    const eventName = poster.manualEventName ?? 'Event Poster';
    const placeholderSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${String(dimensions.width)}" height="${String(dimensions.height)}">
        <rect width="100%" height="100%" fill="${bgColor}"/>
        <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="48">
          ${eventName}
        </text>
      </svg>
    `;
    return Buffer.from(placeholderSvg);
  }
}
