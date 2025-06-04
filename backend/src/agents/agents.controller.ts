import { Controller, Get, Put, Inject, Body } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { AgentEntity } from '../entities/agent.entity';

@Controller('agents') // Removido 'api/' do prefixo
export class AgentsController {
  constructor(
    @Inject(AgentsService) private readonly agentsService: AgentsService,
  ) {}

  @Get('main')
  async getMainAgent(): Promise<AgentEntity | null> {
    return this.agentsService.getMainAgent();
  }

  @Put('main/conversation')
  async updateMainAgentConversation(@Body() data: { conversationId: string }): Promise<AgentEntity> {
    return this.agentsService.updateMainAgentConversation(data.conversationId);
  }
}
