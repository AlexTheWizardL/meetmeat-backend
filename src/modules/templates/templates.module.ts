import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from './entities/template.entity';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { EventsModule } from '../events/events.module';

@Module({
  imports: [TypeOrmModule.forFeature([Template]), EventsModule],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class TemplatesModule {}
