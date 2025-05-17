import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // Adicionado Logger
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Folder } from '../entities/folder.entity'; // Added Folder import
import { Model } from '../entities/model.entity'; // Added Model import
import { ConfigService } from '../config/config.service';
import { AIServiceFactory } from '../models/ai-service.factory';
import { AIProviderService } from '../models/ai-provider.service';
import { ActiveModelService } from '../models/active-model.service';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private configService: ConfigService,
    @InjectRepository(Folder) // Inject Folder repository
    private foldersRepository: Repository<Folder>,
    @InjectRepository(Model) // Inject Model repository
    private modelsRepository: Repository<Model>,
    private aiServiceFactory: AIServiceFactory,
    private aiProviderService: AIProviderService,
    private activeModelService: ActiveModelService,
  ) {}
 
  async findAll(): Promise<Conversation[]> {
    return this.conversationsRepository.find({
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Conversation> {
    return this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages', 'model'],
      order: { messages: { timestamp: 'ASC' } },
    });
  }

  async create(title: string, modelId?: number): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({ title });
    
    if (modelId) {
      const model = await this.modelsRepository.findOneBy({ id: modelId });
      if (model) {
        conversation.modelId = modelId;
        conversation.model = model;
        conversation.modelConfig = model.defaultConfig;
      }
    }
    
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
    
    // Verifica se o conteúdo é uma resposta estruturada com metadados de embasamento
    let messageContent = content;
    let groundingMetadata = null;
    
    try {
      // Tenta parsear o conteúdo como JSON para verificar se contém metadados
      const parsedContent = JSON.parse(content);
      
      // Se for um objeto com text e groundingMetadata, extrair esses valores
      if (parsedContent && parsedContent.text && parsedContent.groundingMetadata) {
        messageContent = parsedContent.text;
        groundingMetadata = JSON.stringify(parsedContent.groundingMetadata);
      }
    } catch (e) {
      // Se não for JSON válido, usa o conteúdo original
      messageContent = content;
    }
    
    const message = this.messagesRepository.create({
      content: messageContent,
      isUser: false,
      conversation,
      groundingMetadata
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
      // Obter o modelo ativo global e sua configuração
      const { model: activeModel, config: activeModelConfig } = await this.activeModelService.getActiveModel();
      
      this.logger.debug(`Gerando resposta para conversa ${conversationId} usando modelo global ${activeModel?.name || 'não especificado'}`);
      
      // Usar o providerService para obter o serviço apropriado ao modelo ativo global
      const aiService = await this.aiProviderService.getService(activeModel);
      
      this.logger.debug(`Serviço de IA obtido para ${activeModel?.provider || 'provedor desconhecido'}`);
      
      const response = await aiService.generateResponse(
        messages,
        systemPrompt,
        false,
        activeModel,
        activeModelConfig
      );
      
      return this.addBotMessage(conversationId, response);
    } catch (error) {
      this.logger.error(`Erro ao gerar resposta para conversa ${conversationId}:`, error);
      // Se ocorrer um erro, cria uma mensagem de erro para não quebrar a conversa
      return this.addBotMessage(
        conversationId, 
        `Erro ao gerar resposta: ${error.message || 'Falha na comunicação com a API'}`
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
  
  // --- Métodos para Modelos ---
  
  async updateConversationModel(conversationId: number, modelId: number, modelConfig?: any): Promise<Conversation> {
    this.logger.log(`Atualizando modelo da conversa ${conversationId} para modelId=${modelId}`);
    
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }
    
    const model = await this.modelsRepository.findOneBy({ id: modelId });
    if (!model) {
      throw new NotFoundException(`Modelo com ID ${modelId} não encontrado.`);
    }
    
    // Guardar o ID do modelo anterior para logging
    const previousModelId = conversation.modelId;
    
    conversation.modelId = modelId;
    conversation.model = model; // Importante: atualizar também a referência ao objeto do modelo
    
    // Se não foi fornecida uma configuração personalizada, usar a padrão do modelo
    if (!modelConfig) {
      conversation.modelConfig = model.defaultConfig;
    } else {
      conversation.modelConfig = modelConfig;
    }
    
    conversation.updatedAt = new Date();
    
    this.logger.log(`Modelo da conversa ${conversationId} alterado: ${previousModelId} -> ${modelId} (${model.provider}/${model.name})`);
    
    return this.conversationsRepository.save(conversation);
  }
  
  async updateModelConfig(conversationId: number, modelConfig: any): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });
    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }
    
    conversation.modelConfig = modelConfig;
    conversation.updatedAt = new Date();
    
    return this.conversationsRepository.save(conversation);
  }
}