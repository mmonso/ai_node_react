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
import { ConfigModule } from './config/config.module';
import { UploadsModule } from './uploads/uploads.module';
import { FoldersModule } from './folders/folders.module'; // Import FoldersModule
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { Config } from './entities/config.entity';
import { Folder } from './entities/folder.entity'; // Import Folder entity
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: join(__dirname, '..', 'data', 'chat.sqlite'),
      entities: [Conversation, Message, Config, Folder], // Add Folder to entities
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
    ConfigModule,
    UploadsModule,
    FoldersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {} 