import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from '../entities/model.entity';

/**
 * Serviço que gerencia o modelo ativo globalmente
 * Este serviço mantém o estado do modelo ativo atual, independente das conversas
 */
@Injectable()
export class ActiveModelService {
  private readonly logger = new Logger(ActiveModelService.name);
  private activeModelId: number | null = null;
  private activeModelConfig: any = null;
  
  constructor(
    @InjectRepository(Model)
    private modelsRepository: Repository<Model>,
  ) {
    this.initDefaultModel();
  }
  
  /**
   * Inicializa com um modelo padrão (primeiro Gemini disponível)
   */
  private async initDefaultModel(): Promise<void> {
    try {
      // Buscar o primeiro modelo Gemini disponível como padrão
      const defaultModel = await this.modelsRepository.findOne({
        where: { 
          provider: 'gemini',
          isAvailable: true 
        }
      });
      
      if (defaultModel) {
        this.activeModelId = defaultModel.id;
        this.activeModelConfig = defaultModel.defaultConfig;
        this.logger.log(`Modelo padrão inicializado: ${defaultModel.name} (ID: ${defaultModel.id})`);
      } else {
        // Se não encontrar um Gemini, pegar qualquer modelo disponível
        const anyModel = await this.modelsRepository.findOne({
          where: { isAvailable: true }
        });
        
        if (anyModel) {
          this.activeModelId = anyModel.id;
          this.activeModelConfig = anyModel.defaultConfig;
          this.logger.log(`Modelo padrão inicializado: ${anyModel.name} (ID: ${anyModel.id})`);
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
      const model = await this.modelsRepository.findOneBy({ id: this.activeModelId });
      return { 
        model, 
        config: this.activeModelConfig || model?.defaultConfig 
      };
    }
    
    return { model: null, config: null };
  }
  
  /**
   * Define o modelo ativo atual
   */
  async setActiveModel(modelId: number, modelConfig?: any): Promise<{ model: Model | null; config: any }> {
    try {
      const model = await this.modelsRepository.findOneBy({ id: modelId });
      
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