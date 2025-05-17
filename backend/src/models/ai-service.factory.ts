import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { OpenAIService } from '../openai/openai.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { AIServiceInterface } from './ai-service.interface';
import { Model } from '../entities/model.entity';

@Injectable()
export class AIServiceFactory {
  constructor(
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
    private anthropicService: AnthropicService,
    // Injetar outros serviços conforme forem adicionados
  ) {}

  getService(model: Model | null): AIServiceInterface {
    if (!model) {
      // Caso não tenha modelo definido, usa o serviço padrão (Gemini)
      return this.geminiService;
    }

    // Selecionar o serviço com base no provedor do modelo
    switch (model.provider) {
      case 'openai':
        return this.openaiService;
      case 'gemini':
        return this.geminiService;
      case 'anthropic':
        return this.anthropicService;
      default:
        // Se o provedor não for reconhecido, usar Gemini como fallback
        return this.geminiService;
    }
  }
} 