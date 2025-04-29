import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Config } from '../entities/config.entity';

@Injectable()
export class ConfigService {
  private DEFAULT_SYSTEM_PROMPT = 'Você é um assistente de IA prestativo, respeitoso e honesto.';

  constructor(
    @InjectRepository(Config)
    private configRepository: Repository<Config>,
  ) {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    const configCount = await this.configRepository.count();
    if (configCount === 0) {
      const config = this.configRepository.create({
        systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      });
      await this.configRepository.save(config);
    }
  }

  async getSystemPrompt(): Promise<string> {
    const config = await this.configRepository.findOne({ where: { id: 1 } });
    return config?.systemPrompt || this.DEFAULT_SYSTEM_PROMPT;
  }

  async updateSystemPrompt(systemPrompt: string): Promise<void> {
    await this.configRepository.update(1, { 
      systemPrompt,
      updatedAt: new Date() 
    });
  }

  async resetSystemPrompt(): Promise<void> {
    await this.configRepository.update(1, { 
      systemPrompt: this.DEFAULT_SYSTEM_PROMPT,
      updatedAt: new Date() 
    });
  }
} 