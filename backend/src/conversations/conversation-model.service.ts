import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Model } from '../entities/model.entity';

@Injectable()
export class ConversationModelService {
  private readonly logger = new Logger(ConversationModelService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Model)
    private modelsRepository: Repository<Model>,
  ) {}

  async updateConversationModel(conversationId: string, modelId: string, modelConfig?: any): Promise<Conversation> {
    this.logger.log(`Atualizando modelo da conversa ${conversationId} para modelId=${modelId}`);
    
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }
    
    const model = await this.modelsRepository.findOneBy({ id: modelId });
    if (!model) {
      throw new NotFoundException(`Modelo com ID ${modelId} não encontrado.`);
    }
    
    const previousModelId = conversation.modelId;
    
    conversation.modelId = modelId;
    conversation.model = model; 
    
    if (!modelConfig) {
      conversation.modelConfig = model.defaultConfig;
    } else {
      conversation.modelConfig = modelConfig;
    }
    
    conversation.updatedAt = new Date();
    
    this.logger.log(`Modelo da conversa ${conversationId} alterado: ${previousModelId} -> ${modelId} (${model.provider}/${model.name})`);
    
    return this.conversationsRepository.save(conversation);
  }
  
  async updateModelConfig(conversationId: string, modelConfig: any): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }
    
    conversation.modelConfig = modelConfig;
    conversation.updatedAt = new Date();
    
    this.logger.log(`Configuração do modelo da conversa ${conversationId} atualizada.`);
    return this.conversationsRepository.save(conversation);
  }
}