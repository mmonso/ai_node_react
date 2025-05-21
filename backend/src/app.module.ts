import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express'; // Importar MulterModule
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ConversationsModule } from './conversations/conversations.module';
import { GeminiModule } from './gemini/gemini.module';
import { OpenAIModule } from './openai/openai.module'; // Importar OpenAIModule
import { AnthropicModule } from './anthropic/anthropic.module'; // Importar AnthropicModule
import { WebSearchModule } from './web-search/web-search.module'; // Importar WebSearchModule
import { ConfigModule } from './config/config.module';
import { UploadsModule } from './uploads/uploads.module';
import { FoldersModule } from './folders/folders.module'; // Import FoldersModule
import { ModelsModule } from './models/models.module'; // Import ModelsModule
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Config } from './entities/config.entity';
import { Folder } from './entities/folder.entity'; // Import Folder entity
import { Model } from './entities/model.entity'; // Import Model entity
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'data', 'chat.sqlite'),
      entities: [Conversation, Message, Config, Folder, Model], // Add Model to entities
      synchronize: true, // Be cautious with synchronize: true in production
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
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
    ConversationsModule,
    GeminiModule,
    OpenAIModule, // Adicionar o módulo OpenAI
    AnthropicModule, // Adicionar o módulo Anthropic
    WebSearchModule, // Adicionar o módulo WebSearch
    ConfigModule,
    UploadsModule,
    FoldersModule,
    ModelsModule, // Add ModelsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 