import { DataSource } from 'typeorm';
import { Model } from './src/entities/model.entity';
import { Message } from './src/entities/message.entity';
import { Conversation } from './src/entities/conversation.entity';
import { Folder } from './src/entities/folder.entity';
import { Config } from './src/entities/config.entity';
import { join } from 'path';
// import * as path from 'path'; // Comentado ou removido

// Use an absolute path with join like in app.module.ts
const dbPath = join(__dirname, 'data', 'chat.sqlite');
console.log(`[DEBUG] TypeORM CLI - Database Path: ${dbPath}`);

export default new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [Model, Message, Conversation, Folder, Config],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  logging: false, // Adicionado para desabilitar logs de query do TypeORM
});