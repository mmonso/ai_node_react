import { Message } from '../entities/message.entity';
import { Model } from '../entities/model.entity';

export interface AIServiceInterface {
  generateResponse(
    messages: Message[],
    systemPrompt: string,
    useWebSearch: boolean,
    model: Model | null,
    modelConfig: any,
    webSearchResults?: string; // Adicionado para resultados de busca na web
  ): Promise<string>;
  
  generateConversationTitle(
    content: string
  ): Promise<string>;

  hasNativeGrounding(): boolean; // Adicionado para verificar o suporte nativo a grounding
}