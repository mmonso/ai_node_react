import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebSearchService {
  private readonly logger = new Logger(WebSearchService.name);

  constructor(
    private configService: ConfigService,
  ) {
    this.logger.log('Serviço de Web Search inicializado');
  }

  async search(query: string): Promise<any[]> {
    this.logger.log(`Realizando pesquisa na web para: ${query}`);
    
    // Implementação simplificada - no futuro, usar Google Custom Search ou outro serviço
    return [
      {
        title: 'Resultado exemplo para: ' + query,
        snippet: 'Este é um resultado de exemplo para a consulta realizada.',
        link: 'https://example.com',
      }
    ];
  }

  // Método para verificar se o grounding está disponível (depende do modelo)
  isGroundingAvailable(provider: string, modelName?: string): boolean {
    // Apenas modelos Gemini suportam grounding nativamente
    if (provider === 'gemini') {
      return true;
    }
    
    // OpenAI não suporta grounding nesta implementação
    if (provider === 'openai') {
      return false;
    }
    
    // Padrão é falso para outros provedores
    return false;
  }
} 