import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ModelsService } from './models.service';
import { Model } from '../entities/model.entity';

@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Get()
  findAll(): Promise<Model[]> {
    return this.modelsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Model> {
    return this.modelsService.findById(Number(id));
  }

  @Get('provider/:provider')
  findByProvider(@Param('provider') provider: string): Promise<Model[]> {
    return this.modelsService.findByProvider(provider);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ): Promise<Model> {
    return this.modelsService.updateAvailability(Number(id), isAvailable);
  }
} 