import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from '../entities/model.entity';

@Injectable()
export class ModelsService implements OnModuleInit {
  private readonly logger = new Logger(ModelsService.name);

  constructor(
    @InjectRepository(Model)
    private modelsRepository: Repository<Model>,
  ) {}

  async onModuleInit() {
    // Verificar se já existem modelos cadastrados
    const count = await this.modelsRepository.count();
    if (count === 0) {
      this.logger.log('Inicializando modelos padrão...');
      await this.initDefaultModels();
    }
  }

  private async initDefaultModels() {
    const defaultModels = [
      // Gemini
      {
        provider: 'gemini',
        name: 'gemini-2.0-flash',
        label: 'Gemini 2.0 Flash',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: true,
          fileInput: false,
          webSearch: true,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      {
        provider: 'gemini',
        name: 'gemini-1.5-pro',
        label: 'Gemini 1.5 Pro',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: true,
          fileInput: false,
          webSearch: true,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      },
      // OpenAI
      {
        provider: 'openai',
        name: 'gpt-4-turbo',
        label: 'GPT-4 Turbo',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: false,
          fileInput: false,
          webSearch: false,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
      {
        provider: 'openai',
        name: 'gpt-4o',
        label: 'GPT-4o',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: true,
          fileInput: false,
          webSearch: false,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
      // Anthropic
      {
        provider: 'anthropic',
        name: 'claude-3-opus',
        label: 'Claude 3 Opus',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: true,
          fileInput: false,
          webSearch: false,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
      {
        provider: 'anthropic',
        name: 'claude-3-5-sonnet',
        label: 'Claude 3.5 Sonnet',
        isAvailable: true,
        capabilities: {
          textInput: true,
          imageInput: true,
          fileInput: false,
          webSearch: false,
        },
        defaultConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      },
    ];

    for (const modelData of defaultModels) {
      const model = this.modelsRepository.create(modelData);
      await this.modelsRepository.save(model);
    }

    this.logger.log(`${defaultModels.length} modelos padrão inicializados com sucesso.`);
  }

  async findAll(): Promise<Model[]> {
    return this.modelsRepository.find();
  }

  async findById(id: number): Promise<Model> {
    return this.modelsRepository.findOne({ where: { id } });
  }

  async findByProvider(provider: string): Promise<Model[]> {
    return this.modelsRepository.find({ where: { provider } });
  }

  async updateAvailability(id: number, isAvailable: boolean): Promise<Model> {
    await this.modelsRepository.update(id, { isAvailable });
    return this.findById(id);
  }
} 