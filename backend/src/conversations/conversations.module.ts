import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';
import { MessageService } from './message.service'; // Adicionado MessageService
import { AIResponseService } from './ai-response.service'; // Adicionado AIResponseService
import { ConversationFolderService } from './conversation-folder.service'; // Adicionado ConversationFolderService
import { ConversationModelService } from './conversation-model.service'; // Adicionado ConversationModelService
import { ConversationTitleService } from './conversation-title.service'; // Importar o novo serviço
import { Conversation } from '../entities/conversation.entity';
import { Message } from '../entities/message.entity';
import { Folder } from '../entities/folder.entity';
import { Model } from '../entities/model.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { OpenAIModule } from '../openai/openai.module';
import { ConfigModule } from '../config/config.module';
import { ModelsModule } from '../models/models.module';
import { WebSearchModule } from '../web-search/web-search.module';
import { AgentsModule } from '../agents/agents.module'; // Adicionar importação

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, Folder, Model]),
    GeminiModule,
    OpenAIModule,
    ConfigModule,
    ModelsModule,
    WebSearchModule,
    forwardRef(() => AgentsModule), // Adicionar para quebrar ciclos potenciais
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
          const ext = extname(file.originalname);
          callback(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    MessageService,
    AIResponseService,
    ConversationFolderService,
    ConversationModelService,
    ConversationTitleService, // Adicionar aos providers
  ],
  exports: [
    ConversationsService,
    MessageService,
    AIResponseService,
    ConversationFolderService,
    ConversationModelService,
    ConversationTitleService, // Adicionar aos exports
  ],
})
export class ConversationsModule {}