import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Adicionar HttpModule
import { GeminiService } from './gemini.service';
import { ConfigModule } from '@nestjs/config';
import { WebSearchModule } from '../web-search/web-search.module';
import { ImageProcessingModule } from '../image-processing/image-processing.module'; // Adicionar import
import { GeminiHelperService } from './gemini-helper.service'; // Adicionar import

@Module({
  imports: [
    ConfigModule,
    WebSearchModule,
    HttpModule, // Adicionar HttpModule aos imports
    ImageProcessingModule, // Adicionar ImageProcessingModule aos imports
  ],
  providers: [GeminiService, GeminiHelperService], // Adicionar GeminiHelperService
  exports: [GeminiService],
})
export class GeminiModule {}