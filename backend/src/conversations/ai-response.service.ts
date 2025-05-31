import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConfigService } from '../config/config.service';
import { AIProviderService } from '../models/ai-provider.service';
import { ActiveModelService } from '../models/active-model.service';
import { MessageService } from './message.service';

@Injectable()
export class AIResponseService {
  private readonly logger = new Logger(AIResponseService.name);

  constructor(
    private configService: ConfigService,
    private aiProviderService: AIProviderService,
    private activeModelService: ActiveModelService,
    private messageService: MessageService,
  ) {}

  async generateAndSaveBotResponse(
    conversation: Conversation,
    messages: Message[], // Passar as mensagens atuais da conversa
    useWebSearch: boolean = false, // Adicionar parâmetro para busca na web
    requestModelConfig?: any, // Configuração específica da requisição
  ): Promise<Message> {
    const conversationId = conversation.id;
    let systemPromptToUse: string;

    this.logger.debug(`[AIResponseService] Gerando resposta para conversationId: ${conversationId}`);
    this.logger.debug(`[AIResponseService] Objeto Conversation recebido: ${JSON.stringify(conversation, null, 2)}`);
    if (conversation.folder) {
      this.logger.debug(`[AIResponseService] Detalhes da Pasta: ID=${conversation.folder.id}, Nome=${conversation.folder.name}, Prompt=${conversation.folder.systemPrompt}`);
    } else {
      this.logger.debug(`[AIResponseService] Conversa (ID: ${conversationId}) não tem pasta associada (conversation.folder é undefined/null).`);
    }

    if (conversation.isPersona && conversation.systemPrompt) {
      this.logger.debug(`Usando system prompt da persona (ID: ${conversationId}): "${conversation.systemPrompt}"`);
      systemPromptToUse = conversation.systemPrompt;
    } else if (conversation.folder && conversation.folder.systemPrompt) { // Considerar prompt da pasta
      this.logger.debug(`Usando system prompt da pasta (${conversation.folder.name}) para conversa (ID: ${conversationId})`);
      systemPromptToUse = conversation.folder.systemPrompt;
    }
    else {
      this.logger.debug(`Usando system prompt global para conversa (ID: ${conversationId}).`);
      systemPromptToUse = await this.configService.getSystemPrompt();
    }

    try {
      const { model: activeModel, config: globalActiveModelConfig } = await this.activeModelService.getActiveModel();
      
      // Usar configuração específica da requisição se fornecida, senão a global do modelo ativo
      const finalModelConfig = requestModelConfig || globalActiveModelConfig;

      this.logger.debug(`Gerando resposta para conversa ${conversationId} usando modelo global ${activeModel?.name || 'não especificado'}`);
      
      const aiService = await this.aiProviderService.getService(activeModel);
      this.logger.debug(`Serviço de IA obtido para ${activeModel?.provider || 'provedor desconhecido'}`);

      const responseText = await aiService.generateResponse(
        messages,
        systemPromptToUse,
        useWebSearch, 
        activeModel,
        finalModelConfig, // Usar a configuração final do modelo
      );
      
      // Salva a resposta do bot usando o MessageService
      return this.messageService.addBotMessage(conversation, responseText);

    } catch (error) {
      this.logger.error(`Erro ao gerar resposta para conversa ${conversationId}:`, error);
      const errorMessage = `Erro ao gerar resposta: ${error.message || 'Falha na comunicação com a API'}`;
      // Salva uma mensagem de erro usando o MessageService
      return this.messageService.addBotMessage(conversation, errorMessage);
    }
  }
}