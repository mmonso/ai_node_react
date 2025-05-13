import { Injectable, NotFoundException } from '@nestjs/common'; // Added NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Folder } from '../entities/folder.entity'; // Added Folder import
import { GeminiService } from '../gemini/gemini.service';
import { ConfigService } from '../config/config.service';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private geminiService: GeminiService,
    private configService: ConfigService,
    @InjectRepository(Folder) // Inject Folder repository
    private foldersRepository: Repository<Folder>,
  ) {}
 
  async findAll(): Promise<Conversation[]> {
    return this.conversationsRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Conversation> {
    return this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages'],
      order: { messages: { timestamp: 'ASC' } },
    });
  }

  async create(title: string): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({ title });
    return this.conversationsRepository.save(conversation);
  }

  async update(id: number, title: string): Promise<Conversation> {
    await this.conversationsRepository.update(id, { 
      title, 
      updatedAt: new Date() 
    });
    return this.findOne(id);
  }

  async delete(id: number): Promise<void> {
    // Deleta todas as mensagens relacionadas à conversa
    await this.messagesRepository
      .createQueryBuilder()
      .delete()
      .where("conversationId = :id", { id })
      .execute();

    // Agora deleta a conversa
    await this.conversationsRepository.delete(id);
  }

  async addUserMessage(conversationId: number, content: string, imageUrl?: string, fileUrl?: string): Promise<Message> {
    const conversation = await this.findOne(conversationId);
    
    const message = this.messagesRepository.create({
      content,
      isUser: true,
      imageUrl,
      fileUrl,
      conversation
    });
    
    await this.messagesRepository.save(message);
    await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });
    
    return message;
  }

  async addBotMessage(conversationId: number, content: string): Promise<Message> {
    const conversation = await this.findOne(conversationId);
    
    const message = this.messagesRepository.create({
      content,
      isUser: false,
      conversation
    });
    
    await this.messagesRepository.save(message);
    await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });
    
    return message;
  }

  async generateBotResponse(conversationId: number): Promise<Message> {
    const conversation = await this.findOne(conversationId);
    const messages = conversation.messages;
    
    const systemPrompt = await this.configService.getSystemPrompt();
    
    try {
      const response = await this.geminiService.generateResponse(
        messages,
        systemPrompt
      );
      
      return this.addBotMessage(conversationId, response);
    } catch (error) {
      // Se ocorrer um erro, cria uma mensagem de erro para não quebrar a conversa
      return this.addBotMessage(
        conversationId, 
        `Erro ao gerar resposta: ${error.message || 'Falha na comunicação com a API Gemini'}`
      );
    }
  }

  // --- Métodos para Pastas ---

  async addConversationToFolder(conversationId: number, folderId: number): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }

    const folder = await this.foldersRepository.findOneBy({ id: folderId });
    if (!folder) {
      throw new NotFoundException(`Pasta com ID ${folderId} não encontrada.`);
    }

    conversation.folderId = folderId;
    conversation.updatedAt = new Date(); // Atualiza timestamp
    
    return this.conversationsRepository.save(conversation);
  }

  async removeConversationFromFolder(conversationId: number): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }

    conversation.folderId = null; // Define como null para remover da pasta
    conversation.updatedAt = new Date(); // Atualiza timestamp

    return this.conversationsRepository.save(conversation);
  }
}