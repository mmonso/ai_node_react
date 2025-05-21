import { DataSource } from 'typeorm';
import { Model } from './src/entities/model.entity';
import { Message } from './src/entities/message.entity';
import { Conversation } from './src/entities/conversation.entity';
import { Folder } from './src/entities/folder.entity';

export default new DataSource({
  type: 'sqlite',
  database: 'data/database.sqlite',
  entities: [Model, Message, Conversation, Folder],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
}); 