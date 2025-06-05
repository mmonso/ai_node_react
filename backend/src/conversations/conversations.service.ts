import { Injectable, NotFoundException, Logger } from '@nestjs/common'; // Adicionado Logger
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm'; // Adicionado EntityManager
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Folder } from '../entities/folder.entity'; // Added Folder import
import { Model } from '../entities/model.entity'; // Added Model import
import { ConfigService } from '../config/config.service';
import { AIServiceFactory } from '../models/ai-service.factory';
// AIProviderService será removido se não for mais necessário diretamente aqui
import { ActiveModelService } from '../models/active-model.service';
import { UpdateMessageDto } from './dto/update-message.dto'; // Adicionado UpdateMessageDto
import { MessageService } from './message.service'; // Adicionado MessageService
import { AIResponseService } from './ai-response.service'; // Adicionado AIResponseService
import { ConversationTitleService } from './conversation-title.service'; // Importar o novo serviço

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private configService: ConfigService,
    @InjectRepository(Model) // Inject Model repository
    private modelsRepository: Repository<Model>,
    private aiServiceFactory: AIServiceFactory,
    // private aiProviderService: AIProviderService, // Removido se não for mais usado diretamente
    private activeModelService: ActiveModelService,
    private messageService: MessageService, // Adicionado MessageService
    private aiResponseService: AIResponseService, // Adicionado AIResponseService
    private conversationTitleService: ConversationTitleService, // Injetar o novo serviço
    private entityManager: EntityManager, // Adicionado EntityManager
  ) {}
  
  async findAll(): Promise<Conversation[]> {
    return this.conversationsRepository
      .createQueryBuilder('conversation')
      .select([
        'conversation.id',
        'conversation.title',
        'conversation.updatedAt',
        'conversation.isPersona',
        'conversation.modelId',
        'conversation.folderId',
      ])
      .orderBy('conversation.updatedAt', 'DESC')
      .getMany();
  }

  async findOne(id: string): Promise<Conversation> {
    this.logger.log(`SERVICE: Buscando conversa com ID: ${id}`);
    const conversation = await this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages', 'model'],
      order: { messages: { timestamp: 'ASC' } },
    });
    if (conversation) {
      this.logger.log(`SERVICE: Conversa ${id} encontrada. Número de mensagens: ${conversation.messages?.length ?? 0}. Título: "${conversation.title}"`);
    } else {
      this.logger.warn(`SERVICE: Conversa com ID: ${id} não encontrada.`);
    }
    return conversation;
  }

  async findOneWithFolder(id: string): Promise<Conversation> {
    return this.conversationsRepository.findOne({
      where: { id },
      relations: ['messages', 'model', 'folder'], // Inclui a relação 'folder'
      order: { messages: { timestamp: 'ASC' } },
    });
  }

  async create(title: string, modelId?: string, systemPrompt?: string, isPersona?: boolean): Promise<Conversation> {
    const conversation = this.conversationsRepository.create({ title, systemPrompt, isPersona });
    
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

  async update(id: string, title: string, isPersona?: boolean, systemPrompt?: string | null): Promise<Conversation> {
    const updatePayload: Partial<Conversation> = { title, updatedAt: new Date() };

    if (isPersona !== undefined) {
      updatePayload.isPersona = isPersona;
    }

    // Permitir que systemPrompt seja definido como null ou uma string
    if (systemPrompt !== undefined) {
      updatePayload.systemPrompt = systemPrompt;
    }

    await this.conversationsRepository.update(id, updatePayload);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.entityManager.transaction(async transactionalEntityManager => {
      // Deleta todas as mensagens relacionadas à conversa
      await transactionalEntityManager
        .createQueryBuilder()
        .delete()
        .from(Message)
        .where("conversationId = :id", { id })
        .execute();

      // Agora deleta a conversa
      await transactionalEntityManager.delete(Conversation, id);
    });
  }

  async addUserMessage(conversationId: string, content: string, imageUrl?: string, fileUrl?: string): Promise<Message> {
    const conversation = await this.conversationsRepository.findOne({
      where: { id: conversationId },
      relations: ['model', 'folder'],
    });

    if (!conversation) {
      throw new NotFoundException(`Conversa com ID ${conversationId} não encontrada.`);
    }
    
    const message = await this.messageService.addUserMessage(conversation, content, imageUrl, fileUrl);
    await this.conversationsRepository.update(conversationId, { updatedAt: new Date() });

    // Chamar o serviço de geração de título após adicionar a mensagem
    // Precisamos garantir que 'conversation' tenha a relação 'messages' carregada
    // ou que o ConversationTitleService lide com isso.
    // O ConversationTitleService já espera 'conversation.messages', então precisamos garantir que esteja lá.
    // Se 'conversation' já foi carregado com 'messages' no início do método, está ok.
    // Se não, precisamos recarregar ou passar os dados necessários.
    // Assumindo que 'conversation' já tem 'messages' populado ou que o title service
    // fará uma verificação segura.
    // Para garantir, vamos recarregar a conversa com as mensagens antes de chamar o title service,
    // ou melhor, passar a conversa já carregada e o conteúdo da mensagem.
    // O ConversationTitleService espera a entidade Conversation e o conteúdo da primeira mensagem.
    // A lógica de quando chamar (ex: só na primeira mensagem) está dentro do ConversationTitleService.
    
    // Recarrega a conversa para garantir que 'messages' esteja atualizado para o ConversationTitleService
    const updatedConversation = await this.findOne(conversationId); // findOne agora aceita string e carrega as mensagens
    if (updatedConversation) {
       // A primeira mensagem é a que acabamos de adicionar.
      await this.conversationTitleService.generateAndSetTitleIfNeeded(updatedConversation, content);
    }
    
    return message;
  }

  // O método generateAndSetTitleIfNeeded foi movido para ConversationTitleService.

  // Os métodos addBotMessage e generateBotResponse foram movidos para AIResponseService
  // e MessageService. O ConversationsController chamará AIResponseService.generateAndSaveBotResponse.

  // Os métodos de gerenciamento de pastas foram movidos para ConversationFolderService.
  // Os métodos de gerenciamento de modelos foram movidos para ConversationModelService.
  // O método updateMessageContent foi movido para MessageService.
  // O ConversationsController precisará chamar os respectivos serviços diretamente.
}
