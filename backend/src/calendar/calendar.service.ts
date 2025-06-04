import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Event } from '../entities/event.entity';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {}

  async createEvent(createEventDto: CreateEventDto): Promise<Event> {
    const newEvent = this.eventRepository.create(createEventDto);
    return this.eventRepository.save(newEvent);
  }

  async findAllEvents(): Promise<Event[]> {
    return this.eventRepository.find();
  }

  async findEventById(id: string): Promise<Event | null> {
    const event = await this.eventRepository.findOne({ where: { id } });
    if (!event) {
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    return event;
  }

  async findEventsByConversationId(conversationId: string): Promise<Event[]> {
    return this.eventRepository.find({ where: { conversationId } });
  }

  async findEventsByCriteria(
    startDate?: string,
    endDate?: string,
    conversationId?: string,
  ): Promise<Event[]> {
    const where: FindOptionsWhere<Event> = {};

    if (conversationId) {
      where.conversationId = conversationId;
    }

    if (startDate && endDate) {
      where.startTime = Between(new Date(startDate), new Date(endDate));
    } else if (startDate) {
      // Se apenas startDate for fornecido, podemos ajustar a lógica
      // Por exemplo, buscar eventos que começam a partir de startDate
      // Ou considerar isso um erro/lógica não suportada.
      // Por simplicidade, vamos assumir que se startDate existe, endDate também deveria.
      // Ou podemos buscar eventos cuja startTime ou endTime esteja após startDate.
      // Para este exemplo, vamos manter a lógica que requer ambos para um intervalo.
      // Se precisar de lógica mais complexa, o QueryBuilder seria melhor.
      // No entanto, para manter simples e usar Between, ambos são necessários.
      // Se apenas um for fornecido, não aplicaremos filtro de data aqui.
      // A IA deve ser instruída a fornecer ambos ou nenhum para filtragem de data.
    }
    
    // Se nenhum critério de data for fornecido, mas conversationId sim, ele filtrará por isso.
    // Se nenhum critério for fornecido, retornará todos os eventos (similar ao findAllEvents).
    // Para evitar retornar todos se nenhum filtro de data for realmente intencionado com conversationId,
    // podemos adicionar uma verificação. Mas por ora, a lógica é:
    // - Se conversationId, filtra por ele.
    // - Se startDate E endDate, filtra por datas (pode ser combinado com conversationId).

    return this.eventRepository.find({ where });
  }

  async updateEvent(id: string, updateEventDto: UpdateEventDto): Promise<Event> {
    const event = await this.findEventById(id); // Reuses findEventById to handle NotFoundException
    if (!event) { // Should be handled by findEventById, but as a safeguard
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    Object.assign(event, updateEventDto);
    return this.eventRepository.save(event);
  }

  async deleteEvent(id: string): Promise<void> {
    const event = await this.findEventById(id);
    if (!event) { // Should be handled by findEventById, but as a safeguard
      throw new NotFoundException(`Event with ID "${id}" not found`);
    }
    await this.eventRepository.softDelete(id);
  }
}