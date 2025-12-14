import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { ParseEventDto } from './dto/parse-event.dto';
import { Event } from './entities/event.entity';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('parse')
  parseFromUrl(@Body() parseEventDto: ParseEventDto): Promise<Event> {
    return this.eventsService.parseFromUrl(parseEventDto.url);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }
}
