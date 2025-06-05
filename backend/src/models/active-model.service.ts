import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
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
        this.logger.warn(`Modelo ativo ID '${this.activeModelId}' não encontrado. Tentando re-inicializar...`);
        const previousActiveModelId = this.activeModelId; // Salva o ID problemático para a mensagem de erro
        this.activeModelId = null; // Força a re-tentativa de initDefaultModel
        this.activeModelConfig = null;
        await this.initDefaultModel();

        if (!this.activeModelId) {
          this.logger.error(`Nenhum modelo ativo pôde ser definido mesmo após tentativa de re-inicialização (ID anterior: ${previousActiveModelId}).`);
          throw new ServiceUnavailableException('Nenhum modelo ativo disponível no momento. Verifique a configuração dos modelos.');
        }
        
        // Tenta buscar o novo modelo ativo após a re-inicialização
        const reinitializedModel = await this.modelsService.findOne(this.activeModelId);
        if (!reinitializedModel) {
          this.logger.error(`Modelo ativo ID '${this.activeModelId}' (após re-inicialização do problemático '${previousActiveModelId}') não encontrado.`);
          this.activeModelId = null;
          this.activeModelConfig = null;
          throw new NotFoundException(`O modelo ativo configurado (ID: ${this.activeModelId}, tentado após falha com ${previousActiveModelId}) não foi encontrado no sistema.`);
        }
        this.logger.log(`Modelo ativo re-inicializado para: ${reinitializedModel.name} após falha ao encontrar ${previousActiveModelId}`);
        return {
            model: reinitializedModel,
            config: this.activeModelConfig || reinitializedModel.defaultConfig
        };
      }
      return {
        model,
        config: this.activeModelConfig || model.defaultConfig
      };
    }
    
    // Se this.activeModelId é nulo (e initDefaultModel no início do método não conseguiu definir um)
    this.logger.error('Nenhum modelo ativo pôde ser definido na inicialização ou após falha na busca.');
    throw new ServiceUnavailableException('Nenhum modelo ativo disponível. Verifique a lista de modelos e sua disponibilidade.');
  }
  
  /**
   * Define o modelo ativo atual
   */
  async setActiveModel(modelId: string, modelConfig?: any): Promise<{ model: Model | null; config: any }> {
    try {
      const model = await this.modelsService.findOne(modelId);
      
      if (!model) {
        this.logger.warn(`Tentativa de definir modelo ativo com ID '${modelId}', mas o modelo não foi encontrado.`);
        throw new NotFoundException(`Modelo com ID '${modelId}' não encontrado. Não foi possível definir como ativo.`);
      }
      
      this.activeModelId = modelId;
      this.activeModelConfig = modelConfig || model.defaultConfig;
      
      this.logger.log(`Modelo ativo alterado para: ${model.name} (ID: ${model.id})`);
      
      return { model, config: this.activeModelConfig };
    } catch (error) {
      this.logger.error(`Erro ao definir modelo ativo (ID: ${modelId}): ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      // Para outros erros, como falhas no modelsService.findOne que não sejam NotFoundException
      throw new ServiceUnavailableException(`Erro ao tentar definir o modelo ativo (ID: ${modelId}): ${error.message}`);
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