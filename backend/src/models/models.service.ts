import { Injectable, Logger, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from '../entities/model.entity';
import { modelsConfig } from '../config/models.config';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  private readonly defaultModelsList: Array<Partial<Model>> = [
    // Gemini Models
    {
      provider: 'gemini',
      name: 'gemini-2.5-pro-preview-05-06',
      label: 'Gemini 2.5 Pro (05-06)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    },
    {
      provider: 'gemini',
      name: 'gemini-2.5-pro-exp-03-25',
      label: 'Gemini 2.5 Pro Exp (03-25)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    },
    {
      provider: 'gemini',
      name: 'gemini-2.5-pro-preview-03-25',
      label: 'Gemini 2.5 Pro Preview (03-25)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    },
    {
      provider: 'gemini',
      name: 'gemini-2.5-flash-preview-04-17',
      label: 'Gemini 2.5 Flash Preview (04-17)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    },
    {
      provider: 'gemini',
      name: 'gemini-2.0-flash', // Pode ser um alias para uma versão específica
      label: 'Gemini 2.0 Flash',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 8192 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-sonnet-20240229',
      label: 'Claude 3 Sonnet (2024-02-29)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-haiku-20240307',
      label: 'Claude 3 Haiku (2024-03-07)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: false }, // Haiku geralmente não tem tool_use por padrão
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-5-sonnet-20240620',
      label: 'Claude 3.5 Sonnet (2024-06-20)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-5-haiku-20241022',
      label: 'Claude 3.5 Haiku (2024-10-22)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: false }, // Assumindo capacidades similares a outros Haiku
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-5-sonnet-20241022',
      label: 'Claude 3.5 Sonnet (2024-10-22)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-7-sonnet-20250219', // Assumindo que este é um futuro modelo Sonnet
      label: 'Claude 3.7 Sonnet (2025-02-19)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'openai',
      name: 'gpt-4o',
      label: 'GPT-4o',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'openai',
      name: 'gpt-4o-mini', // Verificar se este ID é oficial da OpenAI
      label: 'GPT-4o Mini',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'anthropic',
      name: 'claude-3-opus-20240229',
      label: 'Claude 3 Opus (2024-02-29)',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: true, fileInput: false, webSearch: false, tool_use: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
    {
      provider: 'gemini',
      name: 'gemini-2.0-flash-lite', // Pode ser um alias
      label: 'Gemini 2.0 Flash Lite',
      isAvailable: true,
      capabilities: { textInput: true, imageInput: false, fileInput: false, webSearch: true },
      defaultConfig: { temperature: 0.7, maxOutputTokens: 4096 },
    },
  ];

  constructor(
    @InjectRepository(Model)
    private modelsRepository: Repository<Model>,
  ) {}

  async onModuleInit() {
    this.logger.log('ModelsService onModuleInit: Modelos carregados da lista padrão. Sincronização com banco de dados desabilitada.');
    // const count = await this.modelsRepository.count();
    // this.logger.log(`ModelsService onModuleInit: Contagem atual de modelos no banco antes da sincronização: ${count}`);
    
    // // Sempre chamar initDefaultModels para sincronizar.
    // // A lógica dentro de initDefaultModels cuidará de criar ou atualizar.
    // await this.initDefaultModels();
    
    // const finalCount = await this.modelsRepository.count();
    // this.logger.log(`ModelsService onModuleInit: Contagem atual de modelos no banco após a sincronização: ${finalCount}`);
  }

  private async initDefaultModels() { // Renomear para syncModelsWithDefaults seria mais preciso agora
    this.logger.log('initDefaultModels: Sincronização de modelos com o banco de dados está desabilitada.');
    // this.logger.log('Sincronizando modelos do código com o banco de dados...');
    // let createdCount = 0;
    // let updatedCount = 0;

    // for (const modelData of this.defaultModelsList) {
    //   const existingModel = await this.modelsRepository.findOne({
    //     where: { provider: modelData.provider, name: modelData.name },
    //   });

    //   if (!existingModel) {
    //     this.logger.log(`Criando novo modelo padrão: ${modelData.provider}/${modelData.name} com label: '${modelData.label}'`);
    //     const model = this.modelsRepository.create(modelData as Model); // Cast para Model
    //     await this.modelsRepository.save(model);
    //     createdCount++;
    //   } else {
    //     // Verificar se há necessidade de atualização
    //     let needsUpdate = false;
    //     if (existingModel.label !== modelData.label) {
    //       this.logger.log(`Atualizando LABEL para ${modelData.provider}/${modelData.name}: DB='${existingModel.label}', Código='${modelData.label}'`);
    //       existingModel.label = modelData.label;
    //       needsUpdate = true;
    //     }
    //     if (existingModel.isAvailable !== modelData.isAvailable) {
    //       this.logger.log(`Atualizando IS_AVAILABLE para ${modelData.provider}/${modelData.name}: DB='${existingModel.isAvailable}', Código='${modelData.isAvailable}'`);
    //       existingModel.isAvailable = modelData.isAvailable;
    //       needsUpdate = true;
    //     }
    //     if (JSON.stringify(existingModel.capabilities) !== JSON.stringify(modelData.capabilities)) {
    //       this.logger.log(`Atualizando CAPABILITIES para ${modelData.provider}/${modelData.name}.`);
    //       existingModel.capabilities = modelData.capabilities;
    //       needsUpdate = true;
    //     }
    //     if (JSON.stringify(existingModel.defaultConfig) !== JSON.stringify(modelData.defaultConfig)) {
    //       this.logger.log(`Atualizando DEFAULT_CONFIG para ${modelData.provider}/${modelData.name}.`);
    //       existingModel.defaultConfig = modelData.defaultConfig;
    //       needsUpdate = true;
    //     }

    //     if (needsUpdate) {
    //       this.logger.log(`Salvando atualizações para o modelo ${existingModel.provider}/${existingModel.name} (ID: ${existingModel.id})`);
    //       await this.modelsRepository.save(existingModel);
    //       updatedCount++;
    //     } else {
    //       this.logger.log(`Modelo ${existingModel.provider}/${existingModel.name} (ID: ${existingModel.id}) já está sincronizado.`);
    //     }
    //   }
    // }
    // this.logger.log(`Sincronização de modelos concluída. Criados: ${createdCount}, Atualizados: ${updatedCount}. Total na lista padrão: ${this.defaultModelsList.length}.`);
  }

  getDefaultModelDetails(provider: string, modelIdOrName: string): Partial<Model> | null {
    // Tenta encontrar uma correspondência exata primeiro
    let foundModel = this.defaultModelsList.find(
      m => m.provider === provider && m.name === modelIdOrName
    );

    if (foundModel) {
      return { ...foundModel }; // Retorna uma cópia para evitar modificação acidental
    }

    // Se não houver correspondência exata, tenta uma correspondência mais flexível
    // (por exemplo, 'gemini-1.5-pro-latest' da API vs 'gemini-1.5-pro' na lista default)
    // Esta lógica pode ser expandida conforme necessário
    const simplifiedModelId = modelIdOrName.replace(/-latest$/, '').replace(/-[0-9]{8}$/, ''); // Remove sufixos comuns

    foundModel = this.defaultModelsList.find(
      m => m.provider === provider &&
           (m.name.startsWith(simplifiedModelId) || simplifiedModelId.startsWith(m.name))
    );
    
    if (foundModel) {
      this.logger.log(`Fallback para default model: ${provider}/${modelIdOrName} -> ${foundModel.name}`);
      return { ...foundModel };
    }
    
    this.logger.log(`Nenhum default model encontrado para: ${provider}/${modelIdOrName}`);
    return null;
  }

  async findAll(): Promise<Model[]> {
    return this.defaultModelsList.map(modelData => ({
      ...modelData,
      id: modelData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: modelData.provider,
      name: modelData.name,
      label: modelData.label,
      isAvailable: modelData.isAvailable,
      capabilities: modelData.capabilities,
      defaultConfig: modelData.defaultConfig
    } as Model));
  }

  async findOne(id: string): Promise<Model | null> {
    const model = this.defaultModelsList.find(m => m.name === id);
    if (!model) {
      this.logger.warn(`Modelo não encontrado: ${id}`);
      return null;
    }
    return {
      ...model,
      id: model.name,
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: model.provider,
      name: model.name,
      label: model.label,
      isAvailable: model.isAvailable,
      capabilities: model.capabilities,
      defaultConfig: model.defaultConfig
    } as Model;
  }

  async create(modelData: Partial<Model>): Promise<Model> {
    const model = this.modelsRepository.create(modelData);
    return this.modelsRepository.save(model);
  }

  async update(id: string, modelData: Partial<Model>): Promise<Model> {
    const model = await this.findOne(id);
    if (!model) {
      throw new NotFoundException(`Modelo com ID ${id} não encontrado`);
    }
    Object.assign(model, modelData);
    return model;
  }

  async remove(id: string): Promise<void> {
    const model = await this.findOne(id);
    if (!model) {
      throw new NotFoundException(`Modelo com ID ${id} não encontrado`);
    }
    // Como estamos usando a lista estática, não precisamos fazer nada aqui
  }

  async findByProvider(provider: string): Promise<Model[]> {
    return this.defaultModelsList
      .filter(model => model.provider === provider)
      .map(modelData => ({
        ...modelData,
        id: modelData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: modelData.provider,
        name: modelData.name,
        label: modelData.label,
        isAvailable: modelData.isAvailable,
        capabilities: modelData.capabilities,
        defaultConfig: modelData.defaultConfig
      } as Model));
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Model> {
    await this.modelsRepository.update(id, { isAvailable });
    return this.findOne(id.toString());
  }
}
