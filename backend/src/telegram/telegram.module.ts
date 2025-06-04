import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegramService } from './telegram.service';
import { ConfigModule } from '@nestjs/config';
import { AgentsModule } from '../agents/agents.module'; // Modificado
import { AgentEntity } from '../entities/agent.entity'; // Modificado
import { OpenAIModule } from '../openai/openai.module'; // Adicionado
import { ConversationsModule } from '../conversations/conversations.module';

@Module({
  imports: [
    ConfigModule,
    AgentsModule, // Modificado
    OpenAIModule, // Adicionado
    TypeOrmModule.forFeature([AgentEntity]), // Modificado
    ConversationsModule,
  ],
  providers: [TelegramService],
})
export class TelegramModule {}