import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ModelsService } from './models.service';
import { Model } from '../entities/model.entity';
import { CreateModelDto } from './dto/create-model.dto';
import { UpdateModelDto } from './dto/update-model.dto';

@ApiTags('Models')
@Controller('models')
export class ModelsController {
  constructor(
    private readonly modelsService: ModelsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos os modelos de IA disponíveis' })
  @ApiResponse({ status: 200, description: 'Lista de modelos retornada com sucesso.', type: [Model] })
  findAll(): Promise<Model[]> {
    return this.modelsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar um modelo de IA pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do modelo (ex: "gemini-pro")', type: String })
  @ApiResponse({ status: 200, description: 'Modelo retornado com sucesso.', type: Model })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  findOne(@Param('id') id: string): Promise<Model> {
    return this.modelsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar um novo modelo de IA (geralmente para uso interno/gerenciamento)' })
  @ApiBody({ type: CreateModelDto })
  @ApiResponse({ status: 201, description: 'Modelo criado com sucesso.', type: Model })
  create(@Body() createModelDto: CreateModelDto): Promise<Model> {
    return this.modelsService.create(createModelDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar um modelo de IA existente' })
  @ApiParam({ name: 'id', description: 'ID do modelo a ser atualizado', type: String })
  @ApiBody({ type: UpdateModelDto })
  @ApiResponse({ status: 200, description: 'Modelo atualizado com sucesso.', type: Model })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  update(
    @Param('id') id: string,
    @Body() updateModelDto: UpdateModelDto,
  ): Promise<Model> {
    return this.modelsService.update(id, updateModelDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar um modelo de IA' })
  @ApiParam({ name: 'id', description: 'ID do modelo a ser deletado', type: String })
  @ApiResponse({ status: 200, description: 'Modelo deletado com sucesso.' })
  @ApiResponse({ status: 404, description: 'Modelo não encontrado.' })
  remove(@Param('id') id: string): Promise<void> {
    return this.modelsService.remove(id);
  }
}