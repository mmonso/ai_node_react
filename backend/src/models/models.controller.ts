import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common'; // Removido HttpCode, HttpStatus
import { ModelsService } from './models.service';
// ModelSyncService não é mais necessário aqui se o endpoint for removido
import { Model } from '../entities/model.entity';

@Controller('models')
export class ModelsController {
  constructor(
    private readonly modelsService: ModelsService,
    // private readonly modelSyncService: ModelSyncService, // Não injetar mais ModelSyncService
  ) {}

  // Endpoint @Post('sync-now') removido

  @Get()
  findAll(): Promise<Model[]> {
    return this.modelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Model> {
    return this.modelsService.findOne(id);
  }

  @Post()
  create(@Body() modelData: Partial<Model>): Promise<Model> {
    return this.modelsService.create(modelData);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() modelData: Partial<Model>,
  ): Promise<Model> {
    return this.modelsService.update(id, modelData);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<void> {
    return this.modelsService.remove(id);
  }
} 