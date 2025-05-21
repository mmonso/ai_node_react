import { Injectable, Logger } from '@nestjs/common';
import { Model } from '../entities/model.entity';
import { ModelsService } from './models.service';

/**
 * Serviço que gerencia o modelo ativo globalmente
 * Este serviço mantém o estado do modelo ativo atual, independente das conversas
 */
@Injectable()
export class ActiveModelService {
  private readonly logger = new Logger(ActiveModelService.name);
  private activeModelId: string | null = null;
  private activeModelConfig: any = null;
  
  constructor(
    private readonly modelsService: ModelsService,
  ) {
    this.initDefaultModel();
  }
  
  /**
   * Inicializa com um modelo padrão (primeiro Gemini disponível)
   */
  private async initDefaultModel(): Promise<void> {
    try {
      // Buscar todos os modelos disponíveis
      const allModels = await this.modelsService.findAll();
      
      // Tentar encontrar um modelo Gemini primeiro
      const defaultModel = allModels.find(model => 
        model.provider === 'gemini' && model.isAvailable
      );
      
      if (defaultModel) {
        this.activeModelId = defaultModel.name;
        this.activeModelConfig = defaultModel.defaultConfig;
        this.logger.log(`Modelo padrão inicializado: ${defaultModel.name}`);
      } else {
        // Se não encontrar um Gemini, pegar qualquer modelo disponível
        const anyModel = allModels.find(model => model.isAvailable);
        
        if (anyModel) {
          this.activeModelId = anyModel.name;
          this.activeModelConfig = anyModel.defaultConfig;
          this.logger.log(`Modelo padrão inicializado: ${anyModel.name}`);
        } else {
          this.logger.warn('Nenhum modelo disponível encontrado para inicialização');
        }
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar modelo padrão:', error);
    }
  }
  
  /**
   * Obtém o modelo ativo atual
   */
  async getActiveModel(): Promise<{ model: Model | null; config: any }> {
    if (!this.activeModelId) {
      await this.initDefaultModel();
    }
    
    if (this.activeModelId) {
      const model = await this.modelsService.findOne(this.activeModelId);
      if (!model) {
        this.logger.warn(`Modelo ativo não encontrado: ${this.activeModelId}`);
        await this.initDefaultModel();
        return this.getActiveModel();
      }
      return { 
        model, 
        config: this.activeModelConfig || model.defaultConfig 
      };
    }
    
    return { model: null, config: null };
  }
  
  /**
   * Define o modelo ativo atual
   */
  async setActiveModel(modelId: string, modelConfig?: any): Promise<{ model: Model | null; config: any }> {
    try {
      const model = await this.modelsService.findOne(modelId);
      
      if (!model) {
        this.logger.warn(`Modelo com ID ${modelId} não encontrado`);
        return { model: null, config: null };
      }
      
      this.activeModelId = modelId;
      this.activeModelConfig = modelConfig || model.defaultConfig;
      
      this.logger.log(`Modelo ativo alterado para: ${model.name} (ID: ${model.id})`);
      
      return { model, config: this.activeModelConfig };
    } catch (error) {
      this.logger.error(`Erro ao definir modelo ativo (ID: ${modelId}):`, error);
      return { model: null, config: null };
    }
  }
  
  /**
   * Atualiza apenas a configuração do modelo ativo
   */
  updateActiveModelConfig(modelConfig: any): void {
    this.activeModelConfig = modelConfig;
    this.logger.log('Configuração do modelo ativo atualizada');
  }
} 