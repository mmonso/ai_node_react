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
import { ModelsModule } from './models/models.module'; // Import ModelsModule
import { FoldersModule } from './folders/folders.module'; // Import FoldersModule
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Config } from './entities/config.entity';
import { Model } from './entities/model.entity'; // Import Model entity
import { Folder } from './entities/folder.entity'; // Import Folder entity
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
      database: join(process.cwd(), 'data', 'chat.sqlite'),
      entities: [Conversation, Message, Config, Model, Folder],
      synchronize: true,
      logging: false, // Alterado para desabilitar logs de query do TypeORM
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
    ModelsModule, // Add ModelsModule
    FoldersModule, // Add FoldersModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 