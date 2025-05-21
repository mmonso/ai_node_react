import { Controller, Get, Post, Body, Logger } from '@nestjs/common';
import { ActiveModelService } from './active-model.service';

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
  async setActiveModel(@Body() body: { modelId: string; modelConfig?: any }) {
    this.logger.log(`Definindo modelo ativo: ID=${body.modelId}`);
    return this.activeModelService.setActiveModel(body.modelId, body.modelConfig);
  }

  @Post('config')
  async updateConfig(@Body() modelConfig: any) {
    this.logger.log('Atualizando configuração do modelo ativo');
    this.activeModelService.updateActiveModelConfig(modelConfig);
    return { success: true };
  }
}