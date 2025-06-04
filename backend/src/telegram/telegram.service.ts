import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as TelegramBot from 'node-telegram-bot-api';
import { AgentsService } from '../agents/agents.service';
import { OpenAIService } from '../openai/openai.service';
import { ConversationsService } from '../conversations/conversations.service';
import { MessageService } from '../conversations/message.service';
import { Conversation } from '../entities/conversation.entity'; // Para tipagem

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;

  constructor(
    private readonly configService: ConfigService,
    private readonly agentsService: AgentsService,
    private readonly openAIService: OpenAIService,
    private readonly conversationsService: ConversationsService,
    private readonly messageService: MessageService,
  ) {}

  onModuleInit() {
    console.log('Inicializando serviço do Telegram...');
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.error('TELEGRAM_BOT_TOKEN não encontrado nas variáveis de ambiente.');
      console.error('TELEGRAM_BOT_TOKEN não encontrado nas variáveis de ambiente.');
      return;
    }

    try {
      this.bot = new TelegramBot(token, { polling: true });
      console.log('Bot do Telegram inicializado com sucesso!');
    } catch (error) {
      console.error('Erro ao inicializar bot do Telegram:', error);
      this.logger.error('Erro ao inicializar bot do Telegram:', error);
      return;
    }

    // Comando /vincular_agente não precisa mais de parâmetro
    this.bot.onText(/\/vincular_agente$/, async (msg) => {
      const chatId = msg.chat.id;
      console.log(`=== TELEGRAM: Comando /vincular_agente recebido no chat ${chatId} ===`);
      console.log(`=== IMPORTANTE: Use este ID (${chatId}) na variável ALLOWED_TELEGRAM_CHAT_ID no .env ===`);
      this.logger.log(`Comando /vincular_agente recebido no chat ${chatId}`);

      try {
        const agent = await this.agentsService.setTelegramChatIdForMainAgent(chatId.toString());
        if (agent) {
          this.bot.sendMessage(chatId, `Agente principal ('${agent.name}') vinculado a este chat!\n\nIMPORTANTE: Seu Chat ID é: ${chatId}`);
          console.log(`Agente principal ('${agent.name}') vinculado com sucesso ao chat ID ${chatId}.`);
          this.logger.log(`Agente principal ('${agent.name}') vinculado ao chat ID ${chatId}.`);
        } else {
          // Isso teoricamente não deveria acontecer se setTelegramChatIdForMainAgent lida com a criação/erro
          this.bot.sendMessage(chatId, 'Erro: Não foi possível vincular o agente principal.');
          console.error(`Falha ao vincular agente principal ao chat ${chatId} - setTelegramChatIdForMainAgent retornou null/undefined.`);
          this.logger.error(`Falha ao vincular agente principal ao chat ${chatId} - setTelegramChatIdForMainAgent retornou null/undefined.`);
        }
      } catch (error) {
        this.logger.error(`Erro ao processar /vincular_agente para o chat ${chatId}:`, error);
        let userMessage = 'Erro: Ocorreu um problema ao tentar vincular o agente. Tente novamente mais tarde.';
        if (error instanceof InternalServerErrorException) {
            userMessage = 'Erro: Problema ao configurar o agente principal. Contate o administrador.';
        }
        this.bot.sendMessage(chatId, userMessage);
      }
    });

    this.bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = msg.text;

      if (!text) {
        return;
      }

      // Se for o comando /vincular_agente, deixar o handler onText cuidar
      if (text.startsWith('/vincular_agente')) {
        return;
      }
      
      // Verificar se é um chat ID autorizado
      const allowedChatId = this.configService.get<string>('ALLOWED_TELEGRAM_CHAT_ID');
      
      // Se ALLOWED_TELEGRAM_CHAT_ID estiver definido, apenas responder a esse chat específico
      if (allowedChatId && chatId.toString() !== allowedChatId) {
        this.logger.warn(`Mensagem recebida de chat não autorizado: ${chatId}. Apenas o chat ${allowedChatId} está autorizado.`);
        this.bot.sendMessage(chatId, 'Desculpe, este bot está configurado para responder apenas a um usuário específico.');
        return;
      }
      
      this.logger.log(`Mensagem recebida no chat ${chatId}: "${text}"`);

      try {
        const agent = await this.agentsService.getMainAgent();

        if (agent && agent.telegramChatId === chatId.toString()) {
          this.logger.log(`Agente principal ('${agent.name}') está vinculado a este chat (${chatId}). Processando mensagem.`);

          if (!agent.conversationId) {
            this.logger.error(`Agente principal ('${agent.name}') está vinculado ao chat ${chatId} mas não possui um conversationId associado.`);
            this.bot.sendMessage(chatId, 'Erro interno: O agente principal não tem uma conversa configurada. Por favor, contate um administrador.');
            return;
          }

          let conversation: Conversation;
          try {
            conversation = await this.conversationsService.findOne(agent.conversationId);
            if (!conversation) {
              this.logger.error(`Conversa com ID ${agent.conversationId} não encontrada para o agente principal '${agent.name}'.`);
              this.bot.sendMessage(chatId, 'Erro interno: A conversa principal do agente não foi encontrada. Por favor, contate um administrador.');
              return;
            }
          } catch (error) {
            this.logger.error(`Erro ao buscar conversa ${agent.conversationId} para o agente '${agent.name}':`, error);
            this.bot.sendMessage(chatId, 'Erro ao carregar dados da conversa. Tente novamente.');
            return;
          }

          // Salvar mensagem do usuário
          try {
            this.logger.log(`TELEGRAM: Tentando salvar mensagem do usuário na conversa ${conversation.id} (Agente: '${agent.name}'). Conteúdo: "${text}"`);
            const userMsg = await this.messageService.addUserMessage(conversation, text);
            this.logger.log(`TELEGRAM: Mensagem do usuário ID ${userMsg.id} salva na conversa ${conversation.id}.`);
            // Recarregar a conversa para obter a mensagem recém-adicionada no histórico
            conversation = await this.conversationsService.findOne(agent.conversationId);
          } catch (error) {
            this.logger.error(`TELEGRAM: Erro ao salvar mensagem do usuário na conversa ${conversation?.id} (Agente: '${agent.name}'). Conteúdo: "${text}"`, error.stack);
            this.bot.sendMessage(chatId, 'Erro ao salvar sua mensagem. Tente novamente.');
            return;
          }
          
          const systemPromptToUse = conversation.systemPrompt || agent.systemPrompt || 'Você é um assistente útil.';
          
          // Garantir que conversation.messages seja uma array, mesmo que vazia.
          const messagesHistory = conversation.messages || [];

          const aiResponseText = await this.openAIService.generateResponse(
            messagesHistory, // Histórico da conversa
            systemPromptToUse, // System prompt da conversa (ou do agente como fallback)
            false, // useWebSearch
            conversation.model, // Modelo da conversa
            conversation.modelConfig // Configuração do modelo da conversa
          );

          if (aiResponseText) {
            try {
              this.logger.log(`TELEGRAM: Tentando salvar resposta da IA na conversa ${conversation.id} (Agente: '${agent.name}').`);
              const botMsg = await this.messageService.addBotMessage(conversation, aiResponseText);
              this.logger.log(`TELEGRAM: Resposta da IA ID ${botMsg.id} salva na conversa ${conversation.id}.`);
            } catch (error) {
              this.logger.error(`TELEGRAM: Erro ao salvar resposta da IA na conversa ${conversation?.id} (Agente: '${agent.name}'):`, error.stack);
              // Considerar se deve notificar o usuário sobre falha no salvamento,
              // mas a mensagem ainda será enviada ao Telegram.
            }
            this.bot.sendMessage(chatId, aiResponseText);
            this.logger.log(`Resposta da IA enviada para o chat ${chatId} pelo agente '${agent.name}' usando a conversa ${conversation.id}`);
          } else {
            this.logger.warn(`Nenhuma resposta da IA foi gerada ou a resposta está vazia para o agente '${agent.name}' (conversa ${conversation.id}) no chat ${chatId}`);
            this.bot.sendMessage(chatId, 'Desculpe, não consegui processar sua solicitação no momento.');
          }
        } else if (agent && agent.telegramChatId !== chatId.toString()) {
          this.logger.log(`Mensagem recebida no chat ${chatId}, mas o agente principal ('${agent.name}') está vinculado a outro chat (${agent.telegramChatId}).`);
        } else {
          this.logger.log(`Nenhum agente principal configurado ou vinculado encontrado para o chat ${chatId}.`);
          this.bot.sendMessage(chatId, "Este chat não está vinculado ao agente principal. Use `/vincular_agente` para vincular.");
        }
      } catch (error) {
        this.logger.error(`Erro ao processar mensagem do chat ${chatId}:`, error);
        this.bot.sendMessage(chatId, 'Ocorreu um erro ao processar sua mensagem. Tente novamente mais tarde.');
      }
    });

    this.logger.log('Serviço do Telegram inicializado e escutando por mensagens e comandos.');
  }
}
