import { Module, forwardRef } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { ToolsModule } from '../tools/tools.module';
import { ConfigModule } from '../config/config.module'; // Adicionado
import { CalendarModule } from '../calendar/calendar.module';
import { AgentsModule } from '../agents/agents.module';

@Module({
  imports: [
    ToolsModule, 
    ConfigModule, 
    CalendarModule,
    forwardRef(() => AgentsModule) // Adicionado AgentsModule com forwardRef
  ],
  providers: [OpenAIService],
  exports: [OpenAIService],
})
export class OpenAIModule {}