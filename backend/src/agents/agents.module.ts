import { Module, forwardRef } from '@nestjs/common'; // Importar forwardRef
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentEntity } from '../entities/agent.entity';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { ConversationsModule } from '../conversations/conversations.module';
// ConversationsService não precisa ser importado diretamente aqui se for provido pelo ConversationsModule
 
 @Module({
   imports: [
     TypeOrmModule.forFeature([AgentEntity]),
     forwardRef(() => ConversationsModule), // Usar forwardRef aqui
   ],
   controllers: [AgentsController],
   providers: [AgentsService], // ConversationsService foi removido daqui
   exports: [AgentsService],
 })
export class AgentsModule {}