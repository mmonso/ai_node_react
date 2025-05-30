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
// ModelSyncService não é mais importado

@Module({
  imports: [
    // TypeOrmModule.forFeature([Model]) foi removido pois ModelsService agora usa uma lista estática
    // e nenhum outro serviço neste módulo injeta Repository<Model> diretamente.
    GeminiModule,
    OpenAIModule,
    AnthropicModule,
  ],
  controllers: [ModelsController, ActiveModelController],
  providers: [
    ModelsService,
    AIServiceFactory,
    AIProviderService,
    ActiveModelService,
    // ModelSyncService removido dos providers
  ],
  exports: [
    ModelsService,
    AIServiceFactory,
    AIProviderService,
    ActiveModelService,
    // ModelSyncService removido dos exports
  ],
})
export class ModelsModule {}