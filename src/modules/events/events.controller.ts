import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { ParseEventDto } from './dto/parse-event.dto';
import { Event } from './entities/event.entity';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('parse')
  @ApiOperation({
    summary: 'Parse event from URL',
    description:
      'Uses AI to extract event details from a conference/event website URL. Returns cached data if URL was previously parsed.',
  })
  @ApiResponse({
    status: 201,
    description: 'Event parsed successfully',
    type: Event,
  })
  @ApiResponse({ status: 400, description: 'Invalid URL' })
  parseFromUrl(@Body() parseEventDto: ParseEventDto): Promise<Event> {
    return this.eventsService.parseFromUrl(parseEventDto.url);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiParam({ name: 'id', description: 'Event UUID', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Event found', type: Event })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Event> {
    return this.eventsService.findOne(id);
  }
}
