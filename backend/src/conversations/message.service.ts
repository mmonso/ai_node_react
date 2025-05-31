import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { Conversation } from '../entities/conversation.entity';
import { UpdateMessageDto } from './dto/update-message.dto';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
  ) {}

  async addUserMessage(
    conversation: Conversation,
    content: string,
    imageUrl?: string,
    fileUrl?: string,
  ): Promise<Message> {
    const message = this.messagesRepository.create({
      content,
      isUser: true,
      imageUrl,
      fileUrl,
      conversation,
    });

    // A responsabilidade de atualizar o 'updatedAt' da conversa
    // permanecerá no ConversationsService por enquanto, para manter o MessageService focado.
    return this.messagesRepository.save(message);
  }

  async addBotMessage(
    conversation: Conversation,
    content: string,
  ): Promise<Message> {
    let messageContent = content;
    let groundingMetadata = null;

    try {
      const parsedContent = JSON.parse(content);
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
      groundingMetadata,
    });
    
    // A responsabilidade de atualizar o 'updatedAt' da conversa
    // permanecerá no ConversationsService.
    return this.messagesRepository.save(message);
  }

  async updateMessageContent(
    messageId: string,
    updateMessageDto: UpdateMessageDto,
  ): Promise<Message> {
    const numericMessageId = parseInt(messageId, 10);
    if (isNaN(numericMessageId)) {
      throw new NotFoundException(`Invalid Message ID format: "${messageId}"`);
    }

    const message = await this.messagesRepository.findOne({ where: { id: numericMessageId } });

    if (!message) {
      throw new NotFoundException(`Message with ID "${numericMessageId}" not found`);
    }

    message.content = updateMessageDto.content;
    return this.messagesRepository.save(message);
  }
}