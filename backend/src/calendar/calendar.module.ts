import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Event } from '../entities/event.entity';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Event])],
  providers: [CalendarService],
  exports: [CalendarService],
  controllers: [CalendarController],
})
export class CalendarModule {}