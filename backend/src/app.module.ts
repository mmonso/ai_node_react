import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, ConfigService } from '@nestjs/config';
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
import { TelegramModule } from './telegram/telegram.module'; // Import TelegramModule
import { ToolsModule } from './tools/tools.module'; // Import ToolsModule
import { CalendarModule } from './calendar/calendar.module'; // Import CalendarModule
import { AgentsModule } from './agents/agents.module'; // Import AgentsModule
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Config } from './entities/config.entity';
import { Model } from './entities/model.entity'; // Import Model entity
import { Folder } from './entities/folder.entity'; // Import Folder entity
import { Event } from './entities/event.entity'; // Import Event entity
import { AgentEntity } from './entities/agent.entity'; // Import AgentEntity
import { ServeStaticModule } from '@nestjs/serve-static';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [NestConfigModule], // NestConfigModule já é global, mas pode ser mantido para clareza
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get<string>('DB_TYPE', 'sqlite');
        const commonEntities = [Conversation, Message, Config, Model, Folder, Event, AgentEntity];

        if (dbType === 'sqlite') {
          return {
            type: 'sqlite',
            database: configService.get<string>('DB_DATABASE', join(process.cwd(), 'data', 'chat.sqlite')),
            entities: commonEntities,
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
            logging: false,
          };
        } else {
          // Configuração para outros bancos de dados (PostgreSQL, MySQL, etc.)
          return {
            type: dbType as any, // 'postgres', 'mysql', etc.
            host: configService.get<string>('DB_HOST'),
            port: configService.get<number>('DB_PORT'),
            username: configService.get<string>('DB_USERNAME'),
            password: configService.get<string>('DB_PASSWORD'),
            database: configService.get<string>('DB_DATABASE'),
            entities: commonEntities,
            synchronize: configService.get<string>('NODE_ENV') !== 'production', // false em produção
            logging: configService.get<string>('NODE_ENV') !== 'production' ? ['query', 'error'] : ['error'], // Mais logs em dev
            // Adicione outras opções específicas do banco de dados aqui, se necessário
            // Ex: ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : undefined,
          };
        }
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRootAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ([{
        rootPath: configService.get<string>('UPLOADS_DIR', join(__dirname, '..', 'uploads')),
        serveRoot: '/uploads',
      }]),
    }),
    MulterModule.registerAsync({
      imports: [NestConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        storage: diskStorage({
          destination: configService.get<string>('UPLOADS_DIR', './uploads'),
          filename: (req, file, callback) => {
            const uniqueSuffix = `${Date.now()}-${uuidv4()}`;
            const ext = extname(file.originalname);
            callback(null, `${uniqueSuffix}${ext}`);
          },
        }),
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
    TelegramModule, // Add TelegramModule
    ToolsModule, // Add ToolsModule
    CalendarModule, // Add CalendarModule
    AgentsModule, // Add AgentsModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 