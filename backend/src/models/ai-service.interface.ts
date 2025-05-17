import { Message } from '../entities/message.entity';
import { Model } from '../entities/model.entity';

export interface AIServiceInterface {
  generateResponse(
    messages: Message[],
    systemPrompt: string,
    useWebSearch: boolean,
    model: Model | null,
    modelConfig: any
  ): Promise<string>;
  
  generateConversationTitle(
    content: string
  ): Promise<string>;
} 