import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Folder } from '../entities/folder.entity';

@Injectable()
export class ConversationFolderService {
  private readonly logger = new Logger(ConversationFolderService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
  ) {}

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
    conversation.folder = folder; // É bom manter a relação atualizada se for usada
    conversation.updatedAt = new Date(); 
    
    this.logger.log(`Conversa ID ${conversationId} adicionada à Pasta ID ${folderId}`);
    return this.conversationsRepository.save(conversation);
  }

  async removeConversationFromFolder(conversationId: number): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }

    if (!conversation.folderId) {
        this.logger.log(`Conversa ID ${conversationId} já não está em nenhuma pasta.`);
        return conversation; // Ou poderia lançar um BadRequestException se preferir
    }
    
    const previousFolderId = conversation.folderId;
    conversation.folderId = null;
    conversation.folder = null; // Limpar a relação
    conversation.updatedAt = new Date(); 

    this.logger.log(`Conversa ID ${conversationId} removida da Pasta ID ${previousFolderId}`);
    return this.conversationsRepository.save(conversation);
  }
}