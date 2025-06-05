import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ActiveModelService } from './active-model.service';
import { SetActiveModelDto } from './dto/set-active-model.dto';
import { ModelDefaultConfigDto } from './dto/model-default-config.dto'; // Usaremos este diretamente

@Controller('active-model')
export class ActiveModelController {
  private readonly logger = new Logger(ActiveModelController.name);

  constructor(private readonly activeModelService: ActiveModelService) {}

  @Get()
  async getActiveModel() {
    this.logger.log('Obtendo modelo ativo atual');
    return this.activeModelService.getActiveModel();
  }

  @Post()
  async setActiveModel(@Body() setActiveModelDto: SetActiveModelDto) {
    this.logger.log(`Definindo modelo ativo: ID=${setActiveModelDto.modelId}`);
    return this.activeModelService.setActiveModel(setActiveModelDto.modelId, setActiveModelDto.modelConfig);
  }

  @Post('config')
  async updateConfig(@Body() modelConfigDto: ModelDefaultConfigDto) {
    this.logger.log('Atualizando configuração do modelo ativo');
    this.activeModelService.updateActiveModelConfig(modelConfigDto);
    return { success: true };
  }
}