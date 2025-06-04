import { Injectable, InternalServerErrorException, Inject, forwardRef, NotFoundException } from '@nestjs/common'; // Adicionado NotFoundException
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentEntity } from '../entities/agent.entity';
import { ConversationsService } from '../conversations/conversations.service';
// CreateAgentDto e UpdateAgentDto não são mais necessários
// import { CreateAgentDto } from './dto/create-agent.dto';
// import { UpdateAgentDto } from './dto/update-agent.dto';

const MAIN_AGENT_NAME = "MainAgent";
const DEFAULT_SYSTEM_PROMPT = "Você é um assistente prestativo.";

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(AgentEntity)
    private agentsRepository: Repository<AgentEntity>,
    @Inject(forwardRef(() => ConversationsService))
    private conversationsService: ConversationsService,
  ) {}

  // Variável para prevenir chamadas concorrentes
  private mainAgentCreationInProgress = false;
  private mainAgentCreationPromise: Promise<AgentEntity> | null = null;

  async getMainAgent(): Promise<AgentEntity> {
    console.log('AGENTS_SERVICE: getMainAgent() chamado.');
    // Se uma operação de criação já estiver em andamento, aguarde-a terminar
    if (this.mainAgentCreationInProgress && this.mainAgentCreationPromise) {
      console.log('AGENTS_SERVICE: Aguardando a criação do agente principal que já está em andamento...');
      return this.mainAgentCreationPromise;
    }

    // Verificar novamente se o agente já existe
    let agent = await this.agentsRepository.findOne({ where: { name: MAIN_AGENT_NAME } });
    console.log(`AGENTS_SERVICE: Agente encontrado inicialmente: ${agent ? `ID ${agent.id}, ConvID ${agent.conversationId}, TelegramChatID ${agent.telegramChatId}` : 'null'}`);

    if (agent) {
      // Verificar se a conversa associada ao agente existe
      if (agent.conversationId) {
        try {
          const conversation = await this.conversationsService.findOne(agent.conversationId);
          if (conversation) {
            // A conversa existe, podemos retornar o agente
            console.log(`AGENTS_SERVICE: Agente ${agent.id} tem conversa válida ${agent.conversationId}. Retornando.`);
            return agent;
          } else {
            console.log(`AGENTS_SERVICE: Conversa ${agent.conversationId} do agente ${agent.id} não existe mais. Precisará de nova conversa.`);
            // A conversa não existe, precisamos criar uma nova
          }
        } catch (error) {
          console.warn(`AGENTS_SERVICE: Erro ao verificar conversa ${agent.conversationId} do agente ${agent.id} (pode ser normal se a conversa foi deletada):`, error.message);
          // Continuamos o processo para criar uma nova conversa
        }
      } else {
        console.log(`AGENTS_SERVICE: Agente ${agent.id} encontrado, mas não possui conversationId. Precisará de nova conversa.`);
      }
    }

    // Sinalizar que uma operação de criação está começando
    this.mainAgentCreationInProgress = true;
    console.log('AGENTS_SERVICE: Iniciando bloco de criação/atualização do agente principal.');
    
    // Criar uma promise para esta operação de criação
    this.mainAgentCreationPromise = (async () => {
      try {
        // Verificar mais uma vez antes de criar (para maior segurança em caso de concorrência)
        let currentAgentInPromise = await this.agentsRepository.findOne({ where: { name: MAIN_AGENT_NAME } });
        console.log(`AGENTS_SERVICE (Promise): Agente encontrado no início da promise: ${currentAgentInPromise ? `ID ${currentAgentInPromise.id}, ConvID ${currentAgentInPromise.conversationId}` : 'null'}`);
        
        const precisaNovaConversa = !currentAgentInPromise || !currentAgentInPromise.conversationId || !(await this.conversaExiste(currentAgentInPromise.conversationId));
        
        if (!currentAgentInPromise) {
          console.log('AGENTS_SERVICE (Promise): Criando novo agente principal (não existia)...');
          const newAgentData = {
            name: MAIN_AGENT_NAME,
            systemPrompt: DEFAULT_SYSTEM_PROMPT,
          };
          currentAgentInPromise = this.agentsRepository.create(newAgentData);
          // O save ocorrerá abaixo se precisaNovaConversa for true, o que será para um agente novo.
        }
        
        if (precisaNovaConversa) {
          console.log(`AGENTS_SERVICE (Promise): ${currentAgentInPromise.id ? `Agente existente ID ${currentAgentInPromise.id}` : 'Novo agente'} precisa de uma nova conversa.`);
          const mainAgentChat = await this.conversationsService.create(
            "Assistente IA",
            undefined, // modelId
            DEFAULT_SYSTEM_PROMPT, // systemPrompt
            false // isPersona
          );
          console.log(`AGENTS_SERVICE (Promise): Nova conversa "Assistente IA" criada com ID: ${mainAgentChat.id}`);
          currentAgentInPromise.conversationId = mainAgentChat.id;
          console.log(`AGENTS_SERVICE (Promise): Salvando agente ${currentAgentInPromise.id ? `ID ${currentAgentInPromise.id}` : '(novo)'} com conversationId ${currentAgentInPromise.conversationId}`);
          await this.agentsRepository.save(currentAgentInPromise); // Salva o agente com o novo conversationId ou o agente novo
          console.log(`AGENTS_SERVICE (Promise): Agente salvo. ID final: ${currentAgentInPromise.id}, ConvID: ${currentAgentInPromise.conversationId}`);
        } else {
          console.log(`AGENTS_SERVICE (Promise): Agente ID ${currentAgentInPromise.id} já possui conversa válida (${currentAgentInPromise.conversationId}). Nenhuma nova conversa criada.`);
        }
        console.log(`AGENTS_SERVICE (Promise): Retornando agente: ID ${currentAgentInPromise.id}, ConvID ${currentAgentInPromise.conversationId}`);
        return currentAgentInPromise;
      } catch (error) {
        console.error('AGENTS_SERVICE (Promise): Erro crítico ao criar/atualizar o agente principal:', error.stack);
        throw error;
      } finally {
        // Limpar o status após a conclusão, seja sucesso ou falha
        this.mainAgentCreationInProgress = false;
        this.mainAgentCreationPromise = null;
      }
    })();

    return this.mainAgentCreationPromise;
  }

  async setTelegramChatIdForMainAgent(chatId: string): Promise<AgentEntity | null> {
    console.log(`AGENTS_SERVICE: setTelegramChatIdForMainAgent chamado para chatId: ${chatId}`);
    const agent = await this.getMainAgent(); // Este getMainAgent já terá logs detalhados
    if (!agent) {
      console.error("AGENTS_SERVICE: Agente principal não encontrado em setTelegramChatIdForMainAgent (getMainAgent retornou null/undefined).");
      throw new InternalServerErrorException("Agente principal não pôde ser configurado para Telegram.");
    }
    // Verificar se o telegramChatId já é o mesmo para evitar saves desnecessários
    if (agent.telegramChatId === chatId) {
      console.log(`AGENTS_SERVICE: Agente ${agent.id} já possui telegramChatId ${chatId}. Nenhum save necessário.`);
      return agent;
    }
    agent.telegramChatId = chatId;
    console.log(`AGENTS_SERVICE: Salvando agente ${agent.id} com novo telegramChatId ${chatId}. ConvID atual: ${agent.conversationId}`);
    return this.agentsRepository.save(agent);
  }

  // Método auxiliar para verificar se uma conversa existe
  private async conversaExiste(conversationId: string): Promise<boolean> {
    try {
      const conversation = await this.conversationsService.findOne(conversationId);
      return !!conversation;
    } catch (error) {
      // Não logar como erro se for apenas NotFoundException, pois isso é esperado em alguns fluxos
      // O findOne do ConversationsService já loga se não encontrar, então este log pode ser redundante ou menos detalhado.
      // Apenas logamos se for um erro inesperado.
      if (!(error instanceof NotFoundException)) {
        console.warn(`AGENTS_SERVICE: Erro inesperado ao verificar existência da conversa ${conversationId} para o agente:`, error.message);
      }
      return false; // Se findOne lançar NotFoundException, a conversa não existe.
    }
  }

  async updateMainAgentConversation(conversationId: string): Promise<AgentEntity> {
    console.log(`AGENTS_SERVICE: updateMainAgentConversation chamado para conversationId: ${conversationId}`);
    // Verificar se a conversa existe
    const conversationExists = await this.conversaExiste(conversationId);
    if (!conversationExists) {
      // Log mais informativo e lança NotFoundException se a conversa não existir.
      const errorMessage = `AGENTS_SERVICE: Conversa com ID ${conversationId} não encontrada. Não é possível atualizar o agente principal.`;
      console.error(errorMessage);
      throw new NotFoundException(errorMessage);
    }

    // Atualizar o agente principal
    const agent = await this.getMainAgent(); // Este getMainAgent já terá logs detalhados
    if (!agent) {
      // Embora getMainAgent seja projetado para sempre retornar um agente, adicionamos uma verificação de segurança.
      const errorMsg = "AGENTS_SERVICE: Falha crítica ao obter o agente principal durante updateMainAgentConversation.";
      console.error(errorMsg);
      throw new InternalServerErrorException(errorMsg);
    }

    // Verificar se o conversationId já é o mesmo para evitar saves desnecessários
    if (agent.conversationId === conversationId) {
      console.log(`AGENTS_SERVICE: Agente ${agent.id} já possui conversationId ${conversationId}. Nenhum save necessário.`);
      return agent;
    }
    
    agent.conversationId = conversationId;
    console.log(`AGENTS_SERVICE: Salvando agente ${agent.id} com novo conversationId ${conversationId}. TelegramChatID atual: ${agent.telegramChatId}`);
    return this.agentsRepository.save(agent);
  }

  // Métodos CRUD removidos:
  // create(createAgentDto: CreateAgentDto)
  // findAll()
  // findOne(id: string)
  // update(id: string, updateAgentDto: UpdateAgentDto)
  // remove(id: string)
}
