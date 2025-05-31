import { Injectable, Logger, OnModuleInit, NotFoundException, NotImplementedException } from '@nestjs/common';
import { Model } from '../entities/model.entity';
import { defaultModelsList } from '../config/default-models.data';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  constructor() {
    // Construtor agora está vazio, sem injeção de repositório.
  }

  async onModuleInit() {
    this.logger.log('ModelsService onModuleInit: Modelos são carregados da lista estática. O banco de dados não é usado como fonte principal para modelos.');
  }

  getDefaultModelDetails(provider: string, modelIdOrName: string): Partial<Model> | null {
    // Tenta encontrar uma correspondência exata primeiro
    let foundModel = defaultModelsList.find(
      m => m.provider === provider && m.name === modelIdOrName
    );

    if (foundModel) {
      return { ...foundModel }; // Retorna uma cópia para evitar modificação acidental
    }

    // Se não houver correspondência exata, tenta uma correspondência mais flexível
    const simplifiedModelId = modelIdOrName.replace(/-latest$/, '').replace(/-[0-9]{8}$/, '');

    foundModel = defaultModelsList.find(
      m => m.provider === provider &&
           (m.name.startsWith(simplifiedModelId) || simplifiedModelId.startsWith(m.name))
    );
    
    if (foundModel) {
      this.logger.log(`Fallback para default model: ${provider}/${modelIdOrName} -> ${foundModel.name}`);
      return { ...foundModel };
    }
    
    this.logger.warn(`Nenhum default model encontrado para: ${provider}/${modelIdOrName}`);
    return null;
  }

  async findAll(): Promise<Model[]> {
    return defaultModelsList.map(modelData => ({
      ...modelData,
      id: modelData.name, // Usando 'name' como 'id' para consistência com a abordagem estática
      createdAt: new Date(), // Simulado
      updatedAt: new Date(), // Simulado
    } as Model));
  }

  async findOne(id: string): Promise<Model | null> {
    const modelData = defaultModelsList.find(m => m.name === id);
    if (!modelData) {
      this.logger.warn(`Modelo com ID (name) '${id}' não encontrado na lista estática.`);
      return null;
    }
    return {
      ...modelData,
      id: modelData.name,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Model;
  }

  async create(modelData: Partial<Model>): Promise<Model> {
    this.logger.warn(`Operação 'create' não é suportada para modelos definidos estaticamente. Dados recebidos: ${JSON.stringify(modelData)}`);
    // Lança um erro para indicar que a operação não é implementada para o modo estático.
    throw new NotImplementedException('Criação de modelos não é suportada pois são definidos estaticamente.');
    // Alternativamente, poderia retornar null ou o modelData sem fazer nada.
    // return Promise.resolve(modelData as Model); 
  }

  async update(id: string, modelData: Partial<Model>): Promise<Model> {
    this.logger.warn(`Operação 'update' para o modelo ID (name) '${id}' não altera a lista estática. Dados recebidos: ${JSON.stringify(modelData)}`);
    const existingModel = await this.findOne(id);
    if (!existingModel) {
      throw new NotFoundException(`Modelo com ID (name) '${id}' não encontrado para atualização.`);
    }
    // Poderia simular uma atualização em memória para a requisição atual, mas não persistiria na lista estática.
    // Object.assign(existingModel, modelData);
    // return existingModel;
    throw new NotImplementedException('Atualização de modelos não é suportada pois são definidos estaticamente.');
  }

  async remove(id: string): Promise<void> {
    this.logger.warn(`Operação 'remove' para o modelo ID (name) '${id}' não altera a lista estática.`);
    const existingModel = await this.findOne(id);
    if (!existingModel) {
      throw new NotFoundException(`Modelo com ID (name) '${id}' não encontrado para remoção.`);
    }
    throw new NotImplementedException('Remoção de modelos não é suportada pois são definidos estaticamente.');
    // return Promise.resolve();
  }

  async findByProvider(provider: string): Promise<Model[]> {
    return defaultModelsList
      .filter(model => model.provider === provider)
      .map(modelData => ({
        ...modelData,
        id: modelData.name,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Model));
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Model> { // ID agora é string (name)
    this.logger.warn(`Operação 'updateAvailability' para o modelo ID (name) '${id}' com isAvailable=${isAvailable} não altera a lista estática de forma persistente.`);
    const model = await this.findOne(id);
    if (!model) {
      throw new NotFoundException(`Modelo com ID (name) '${id}' não encontrado para atualizar disponibilidade.`);
    }
    // Se fosse necessário alterar em memória para a sessão:
    // const modelInList = defaultModelsList.find(m => m.name === id);
    // if (modelInList) {
    //   modelInList.isAvailable = isAvailable;
    //   model.isAvailable = isAvailable; // Atualiza a cópia que será retornada
    //   this.logger.log(`Disponibilidade do modelo '${id}' alterada em memória para ${isAvailable}.`);
    //   return model;
    // }
    throw new NotImplementedException('Atualização de disponibilidade de modelos não é suportada de forma persistente pois são definidos estaticamente.');
  }
}
