import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { ConfigService } from '../config/config.service';
import { AIProviderService } from '../models/ai-provider.service';
import { ActiveModelService } from '../models/active-model.service';
import { MessageService } from './message.service';
import { WebSearchService } from '../web-search/web-search.service'; // Importar WebSearchService

@Injectable()
export class AIResponseService {
  private readonly logger = new Logger(AIResponseService.name);

  constructor(
    private configService: ConfigService,
    private aiProviderService: AIProviderService,
    private activeModelService: ActiveModelService,
    private messageService: MessageService,
    private webSearchService: WebSearchService, // Injetar WebSearchService
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

      let webSearchResultsString: string | undefined = undefined;

      if (useWebSearch && !aiService.hasNativeGrounding()) {
        this.logger.log(`[AIResponseService] Grounding nativo NÃO disponível para ${activeModel?.provider}. Usando WebSearchService.`);
        if (messages.length > 0) {
          const lastUserMessage = messages[messages.length - 1];
          // Garantir que a última mensagem seja do usuário e tenha conteúdo
          if (lastUserMessage.isUser && typeof lastUserMessage.content === 'string' && lastUserMessage.content.trim() !== '') {
            const query = lastUserMessage.content;
            this.logger.log(`[AIResponseService] Realizando busca na web com a query: "${query}"`);
            try {
              const searchResults = await this.webSearchService.search(query);
              if (searchResults && searchResults.length > 0) {
                webSearchResultsString = "Resultados da busca na web:\n";
                searchResults.forEach((result, index) => {
                  webSearchResultsString += `\n[${index + 1}] ${result.title}\nSnippet: ${result.snippet}\nLink: ${result.link}\n`;
                });
                this.logger.debug(`[AIResponseService] Resultados da busca formatados: ${webSearchResultsString}`);
              } else {
                this.logger.log('[AIResponseService] Busca na web não retornou resultados.');
              }
            } catch (searchError) {
              this.logger.error(`[AIResponseService] Erro ao realizar busca na web: ${searchError.message}`, searchError.stack);
              // Não interromper o fluxo, apenas logar o erro. A IA prosseguirá sem os resultados da busca.
            }
          } else {
            this.logger.warn('[AIResponseService] Não foi possível determinar a query para a busca na web a partir da última mensagem.');
          }
        } else {
          this.logger.warn('[AIResponseService] Não há mensagens na conversa para usar como query para a busca na web.');
        }
      } else if (useWebSearch && aiService.hasNativeGrounding()) {
        this.logger.log(`[AIResponseService] Grounding nativo DISPONÍVEL para ${activeModel?.provider}. WebSearchService não será chamado separadamente.`);
      }


      const responseText = await aiService.generateResponse(
        messages,
        systemPromptToUse,
        useWebSearch,
        activeModel,
        finalModelConfig, // Usar a configuração final do modelo
        webSearchResultsString, // Passar os resultados da busca (ou undefined)
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