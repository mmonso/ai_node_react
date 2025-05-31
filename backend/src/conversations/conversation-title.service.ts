import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from '../entities/conversation.entity';
import { AIProviderService } from '../models/ai-provider.service';

@Injectable()
export class ConversationTitleService {
  private readonly logger = new Logger(ConversationTitleService.name);

  constructor(
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
    private aiProviderService: AIProviderService,
  ) {}

  async generateAndSetTitleIfNeeded(conversation: Conversation, firstMessageContent: string): Promise<void> {
    // Verifica se a conversa já tem mensagens e se o título é o padrão.
    // A verificação de conversation.messages.length === 1 pode ser mais robusta
    // se considerarmos o estado da conversa em vez do número exato de mensagens,
    // por exemplo, uma flag 'titleGenerated' ou similar. Por ora, mantemos a lógica original.
    if (conversation.title === 'Nova Conversa' && conversation.messages && conversation.messages.length > 0) {
      this.logger.log(`Conversa "${conversation.title}" (${conversation.id}) com primeira mensagem. Tentando gerar novo título...`);
      
      try {
        const titleAiService = await this.aiProviderService.getService();
        const newTitle = await titleAiService.generateConversationTitle(firstMessageContent);
        
        if (newTitle && newTitle.trim() !== '' && newTitle !== 'Nova Conversa') {
          this.logger.log(`Novo título gerado para conversa ${conversation.id}: "${newTitle}". Atualizando...`);
          await this.conversationsRepository.update(conversation.id, {
            title: newTitle,
            updatedAt: new Date() // Garante que updatedAt seja atualizado
          });
          this.logger.log(`Título da conversa ${conversation.id} atualizado com sucesso para "${newTitle}".`);
        } else {
          this.logger.log(`Título gerado "${newTitle}" não é válido ou é igual a "Nova Conversa". Título não atualizado para conversa ${conversation.id}.`);
        }
      } catch (err) {
        this.logger.error(`Falha ao gerar/atualizar título para conversa ${conversation.id}:`, err);
      }
    }
  }
}