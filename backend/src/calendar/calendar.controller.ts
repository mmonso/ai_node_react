import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Event } from '../entities/event.entity';

@Controller('calendar/events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createEventDto: CreateEventDto): Promise<Event> {
    return this.calendarService.createEvent(createEventDto);
  }

  @Get()
  findAll(): Promise<Event[]> {
    return this.calendarService.findAllEvents();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Event | null> {
    return this.calendarService.findEventById(id);
  }

  @Get('conversation/:conversationId')
  findByConversationId(@Param('conversationId', ParseUUIDPipe) conversationId: string): Promise<Event[]> {
    return this.calendarService.findEventsByConversationId(conversationId);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    return this.calendarService.updateEvent(id, updateEventDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.calendarService.deleteEvent(id);
  }
}