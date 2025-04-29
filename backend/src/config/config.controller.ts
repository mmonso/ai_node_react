import { Controller, Get, Put, Body } from '@nestjs/common';
import { ConfigService } from './config.service';

@Controller('config')
export class ConfigController {
  constructor(private configService: ConfigService) {}

  @Get('system-prompt')
  async getSystemPrompt(): Promise<{ systemPrompt: string }> {
    const systemPrompt = await this.configService.getSystemPrompt();
    return { systemPrompt };
  }

  @Put('system-prompt')
  async updateSystemPrompt(
    @Body() body: { systemPrompt: string },
  ): Promise<{ success: boolean }> {
    await this.configService.updateSystemPrompt(body.systemPrompt);
    return { success: true };
  }

  @Put('system-prompt/reset')
  async resetSystemPrompt(): Promise<{ success: boolean }> {
    await this.configService.resetSystemPrompt();
    return { success: true };
  }
} 