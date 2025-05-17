import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelsService } from './models.service';
import { ModelsController } from './models.controller';
import { Model } from '../entities/model.entity';
import { AIServiceFactory } from './ai-service.factory';
import { AIProviderService } from './ai-provider.service';
import { ActiveModelService } from './active-model.service';
import { ActiveModelController } from './active-model.controller';
import { GeminiModule } from '../gemini/gemini.module';
import { OpenAIModule } from '../openai/openai.module';
import { AnthropicModule } from '../anthropic/anthropic.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Model]),
    GeminiModule,
    OpenAIModule,
    AnthropicModule,
  ],
  controllers: [ModelsController, ActiveModelController],
  providers: [ModelsService, AIServiceFactory, AIProviderService, ActiveModelService],
  exports: [ModelsService, AIServiceFactory, AIProviderService, ActiveModelService],
})
export class ModelsModule {} 