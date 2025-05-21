import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ModelsService } from './models.service';
import { GeminiService } from '../gemini/gemini.service';
import { OpenAIService } from '../openai/openai.service';
import { AnthropicService } from '../anthropic/anthropic.service'; // Adicionado
import { ProviderApiService, ProviderModelInfo } from './provider-api.service.interface';
import { Model } from '../entities/model.entity';

@Injectable()
export class ModelSyncService {
  private readonly logger = new Logger(ModelSyncService.name);
  private readonly providerServices: ProviderApiService[];
  private readonly SOFT_DELETE_GRACE_PERIOD_HOURS = 72;

  constructor(
    private readonly modelsService: ModelsService,
    private readonly geminiService: GeminiService,
    private readonly openAIService: OpenAIService,
    private readonly anthropicService: AnthropicService, // Adicionado
  ) {
    this.providerServices = [geminiService, openAIService, anthropicService]; // Adicionado anthropicService
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Comentado para desabilitar a sincronização automática agendada
  async handleCron() {
    this.logger.log('Job de sincronização de modelos agendado ESTÁ DESABILITADO.');
    // await this.synchronizeAllModels(); // Não executar
    this.logger.log('Job de sincronização de modelos concluído.');
  }

  async synchronizeAllModels(): Promise<void> {
    this.logger.log('Iniciando sincronização de modelos para todos os provedores...');

    for (const providerService of this.providerServices) {
      const providerName = providerService.getProviderName();
      
      this.logger.log(`Iniciando sincronização de modelos para o provedor: ${providerName}`);

      try {
        const providerModelsInfo: ProviderModelInfo[] = await providerService.listModels();
        this.logger.log(`Recebidos ${providerModelsInfo.length} modelos do provedor ${providerName}`);

        if (!providerModelsInfo) {
            this.logger.warn(`Nenhuma informação de modelo recebida do provedor ${providerName}. Pulando sincronização para este provedor.`);
            continue;
        }

        const dbModels: Model[] = await this.modelsService.findByProvider(providerName);
        this.logger.log(`Encontrados ${dbModels.length} modelos do provedor ${providerName} no banco de dados.`);

        const providerModelMap = new Map(providerModelsInfo.map(m => [m.idOrName, m]));
        const dbModelMap = new Map(dbModels.map(m => [m.name, m]));

        let modelsAdded = 0;
        let modelsUpdated = 0;
        let modelsDeactivated = 0;

        // 1. Adicionar ou atualizar modelos do provedor
        for (const pModelInfo of providerModelsInfo) {
          const existingDbModel = dbModelMap.get(pModelInfo.idOrName);
          const capabilities = this.mapProviderCapabilities(pModelInfo, providerName);

          if (existingDbModel) {
            let needsUpdate = false;
            const updatePayload: Partial<Model> = {};

            if (existingDbModel.label !== pModelInfo.label) {
              updatePayload.label = pModelInfo.label;
              needsUpdate = true;
            }
            if (pModelInfo.description) {
                 this.logger.debug(`Descrição do provedor para ${pModelInfo.idOrName} (${providerName}): ${pModelInfo.description}`);
            }
            if (JSON.stringify(existingDbModel.capabilities) !== JSON.stringify(capabilities)) {
              updatePayload.capabilities = capabilities;
              needsUpdate = true;
            }
            if (pModelInfo.contextLength) {
                this.logger.debug(`Context length do provedor para ${pModelInfo.idOrName} (${providerName}): ${pModelInfo.contextLength}`);
            }
            const providerDefaultConfig = pModelInfo.raw?.defaultConfig || (pModelInfo as any).defaultConfig;
            if (providerDefaultConfig && JSON.stringify(existingDbModel.defaultConfig) !== JSON.stringify(providerDefaultConfig)) {
              updatePayload.defaultConfig = providerDefaultConfig;
              needsUpdate = true;
            }

            // Sempre atualiza lastSeenAt e reseta markedAsMissingSince se o modelo for encontrado na API
            updatePayload.lastSeenAt = new Date();
            updatePayload.markedAsMissingSince = null;
            if (!existingDbModel.isAvailable) { // Se estava inativo, reativa
                updatePayload.isAvailable = true;
            }
            needsUpdate = true; // Garante que o update ocorra para lastSeenAt e markedAsMissingSince

            if (needsUpdate) {
              await this.modelsService.update(existingDbModel.id, updatePayload);
              this.logger.log(`Modelo '${pModelInfo.idOrName}' (${providerName}) atualizado (lastSeenAt, etc.).`);
              modelsUpdated++;
            }
          } else {
            // Novo modelo
            const defaultModelDetails = this.modelsService.getDefaultModelDetails(providerName, pModelInfo.idOrName);
            
            const newModelData: Partial<Model> = {
              provider: providerName,
              name: pModelInfo.idOrName,
              label: pModelInfo.label || defaultModelDetails?.label || pModelInfo.idOrName,
              isAvailable: true,
              capabilities: defaultModelDetails?.capabilities ? { ...defaultModelDetails.capabilities, ...capabilities } : capabilities,
              defaultConfig: pModelInfo.raw?.defaultConfig || (pModelInfo as any).defaultConfig || defaultModelDetails?.defaultConfig || {},
              lastSeenAt: new Date(), // Novo modelo é visto agora
              markedAsMissingSince: null,
            };

            if (defaultModelDetails) {
              this.logger.log(`Usando detalhes do modelo padrão para enriquecer ${pModelInfo.idOrName} (${providerName}). Label padrão: ${defaultModelDetails.label}`);
            }
            
            this.logger.log(`Criando novo modelo: ${newModelData.name} (${providerName}). Label: ${newModelData.label}. Desc API: ${pModelInfo.description}, CtxLen API: ${pModelInfo.contextLength}`);
            await this.modelsService.create(newModelData);
            modelsAdded++;
          }
        }

        // 2. Lidar com modelos do DB que não foram encontrados na API (Soft Delete Logic)
        const now = new Date();
        for (const dbModel of dbModels) {
          if (!providerModelMap.has(dbModel.name)) { // Modelo do DB não encontrado na API
            if (dbModel.markedAsMissingSince === null) {
              // Primeira vez que não é encontrado, marca como ausente
              await this.modelsService.update(dbModel.id, { markedAsMissingSince: now });
              this.logger.log(`Modelo '${dbModel.name}' (${providerName}) não encontrado na API. Marcado como ausente desde ${now.toISOString()}.`);
            } else {
              // Já estava marcado como ausente, verificar período de tolerância
              const missingSince = new Date(dbModel.markedAsMissingSince);
              const hoursMissing = (now.getTime() - missingSince.getTime()) / (1000 * 60 * 60);

              if (hoursMissing > this.SOFT_DELETE_GRACE_PERIOD_HOURS) {
                if (dbModel.isAvailable) { // Apenas desativa se estiver ativo
                  await this.modelsService.update(dbModel.id, { isAvailable: false });
                  this.logger.log(`Modelo '${dbModel.name}' (${providerName}) desativado após período de tolerância de ${this.SOFT_DELETE_GRACE_PERIOD_HOURS}h. Estava ausente desde ${dbModel.markedAsMissingSince.toISOString()}.`);
                  modelsDeactivated++;
                } else {
                  this.logger.log(`Modelo '${dbModel.name}' (${providerName}) continua ausente e já está inativo. Ausente desde ${dbModel.markedAsMissingSince.toISOString()}.`);
                }
              } else {
                this.logger.log(`Modelo '${dbModel.name}' (${providerName}) continua ausente, mas dentro do período de tolerância. Ausente desde ${dbModel.markedAsMissingSince.toISOString()} (${hoursMissing.toFixed(2)}h / ${this.SOFT_DELETE_GRACE_PERIOD_HOURS}h).`);
              }
            }
          }
        }

        this.logger.log(
          `Sincronização para ${providerName} concluída. Adicionados: ${modelsAdded}, Atualizados: ${modelsUpdated}, Desativados: ${modelsDeactivated}`,
        );
      } catch (error) {
        this.logger.error(`Erro durante a sincronização de modelos para ${providerName}:`, error);
      }
    }
    this.logger.log('Sincronização de todos os provedores concluída.');
  }

  private mapProviderCapabilities(providerModelInfo: ProviderModelInfo, providerName: string): Model['capabilities'] {
    const modelCaps = providerModelInfo.capabilities;
    const inputModalities = providerModelInfo.inputModalities || [];

    let textInput = true; // Default assumption for most language models
    let imageInput = false;
    let webSearch = false;

    if (Array.isArray(inputModalities)) {
        if (inputModalities.includes('text')) textInput = true;
        if (inputModalities.includes('image') || inputModalities.includes('vision')) imageInput = true;
    }

    if (typeof modelCaps === 'object' && modelCaps !== null) {
        if ('vision' in modelCaps && modelCaps.vision) imageInput = true;
        if ('tool_use' in modelCaps && modelCaps.tool_use) webSearch = true;
        if ('tools' in modelCaps && modelCaps.tools) webSearch = true; // OpenAI pode usar 'tools'
        if ('grounding' in modelCaps && modelCaps.grounding) webSearch = true;
        if ('webSearch' in modelCaps && modelCaps.webSearch) webSearch = true; // Explicit webSearch capability
        if ('json_mode' in modelCaps && modelCaps.json_mode) { /* não mapeado diretamente para Model['capabilities'] ainda */ }
        if ('multimodal' in modelCaps && modelCaps.multimodal) {
            imageInput = true; // Multimodal geralmente implica imagem
        }
    } else if (Array.isArray(modelCaps)) {
        if (modelCaps.includes('vision')) imageInput = true;
        if (modelCaps.includes('tool_use') || modelCaps.includes('tools')) webSearch = true;
        if (modelCaps.includes('grounding')) webSearch = true;
        if (modelCaps.includes('web_search')) webSearch = true;
    }

    // Inferências baseadas no nome do modelo ou provedor
    if (providerModelInfo.idOrName.toLowerCase().includes('vision') || (providerName === 'openai' && providerModelInfo.idOrName.includes('gpt-4'))) {
        imageInput = true;
    }
    if (providerName === 'gemini' && (providerModelInfo.idOrName.includes('flash') || providerModelInfo.idOrName.includes('pro'))) {
        // Gemini Flash e Pro geralmente têm tool_use que pode ser usado para web search via API
        webSearch = true;
    }


    return {
      textInput: textInput,
      imageInput: imageInput,
      fileInput: false,
      webSearch: webSearch,
    };
  }
}