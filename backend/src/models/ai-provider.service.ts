import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { OpenAIService } from '../openai/openai.service';
import { AnthropicService } from '../anthropic/anthropic.service';
import { ConfigService } from '@nestjs/config';
import { Model } from '../entities/model.entity';
import { AIServiceInterface } from './ai-service.interface';
import { ActiveModelService } from './active-model.service';

/**
 * Serviço central para gerenciar provedores de IA
 * Esta classe funciona como uma camada adicional acima da Factory
 * para garantir consistência na mudança de modelos
 */
@Injectable()
export class AIProviderService {
  private readonly logger = new Logger(AIProviderService.name);
  private serviceCache: Map<string, AIServiceInterface> = new Map();
  
  constructor(
    private geminiService: GeminiService,
    private openaiService: OpenAIService,
    private anthropicService: AnthropicService,
    private configService: ConfigService,
    private activeModelService: ActiveModelService,
  ) {
    // Inicializa o cache com os serviços disponíveis
    this.serviceCache.set('gemini', this.geminiService);
    this.serviceCache.set('openai', this.openaiService);
    this.serviceCache.set('anthropic', this.anthropicService);
    
    this.logger.log('AIProviderService inicializado com cache de serviços');
  }

  /**
   * Retorna o serviço de IA apropriado para o modelo fornecido
   * Se não for fornecido um modelo, usa o modelo ativo global
   */
  async getService(model?: Model | null): Promise<AIServiceInterface> {
    // Se não houver modelo específico, usar o modelo ativo global
    if (!model) {
      const { model: activeModel } = await this.activeModelService.getActiveModel();
      if (activeModel) {
        this.logger.debug(`Usando modelo ativo global: ${activeModel.name} (${activeModel.provider})`);
        return this.getProviderServiceByModel(activeModel);
      } else {
        this.logger.debug('Nenhum modelo ativo global encontrado, usando Gemini como padrão');
        return this.getProviderService('gemini');
      }
    }

    return this.getProviderServiceByModel(model);
  }
  
  /**
   * Retorna o serviço baseado em um objeto modelo
   */
  private getProviderServiceByModel(model: Model): AIServiceInterface {
    const provider = model.provider;
    
    // Verifica se o provedor é válido
    if (!provider || !this.isValidProvider(provider)) {
      this.logger.warn(`Provedor inválido ou não suportado: ${provider}. Usando Gemini como fallback.`);
      return this.getProviderService('gemini');
    }
    
    this.logger.debug(`Obtendo serviço para provedor: ${provider}`);
    return this.getProviderService(provider);
  }
  
  /**
   * Verifica se o provedor informado é válido e suportado
   */
  private isValidProvider(provider: string): boolean {
    return ['gemini', 'openai', 'anthropic'].includes(provider);
  }
  
  /**
   * Retorna o serviço de IA para o provedor especificado, utilizando cache
   */
  private getProviderService(provider: string): AIServiceInterface {
    // Recupera do cache se disponível
    if (this.serviceCache.has(provider)) {
      return this.serviceCache.get(provider);
    }
    
    // Se não estiver no cache (não deveria acontecer), cria uma instância baseada no provedor
    let service: AIServiceInterface;
    
    switch (provider) {
      case 'openai':
        service = this.openaiService;
        break;
      case 'anthropic':
        service = this.anthropicService;
        break;
      case 'gemini':
      default:
        service = this.geminiService;
        break;
    }
    
    // Adiciona ao cache para uso futuro
    this.serviceCache.set(provider, service);
    return service;
  }

  /**
   * Limpa o cache de serviços para uma conversa específica
   * @param conversationId ID da conversa
   */
  resetServiceCache(conversationId: number): void {
    this.serviceCache.clear();
    this.logger.log(`Cache de serviço para conversa ${conversationId} foi resetado`);
  }

  /**
   * Limpa todo o cache de serviços
   */
  resetAllServiceCaches(): void {
    this.serviceCache.clear();
    this.logger.log('Todo o cache de serviços foi resetado');
  }
} 