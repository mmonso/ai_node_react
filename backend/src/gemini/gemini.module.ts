import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios'; // Adicionar HttpModule
import { GeminiService } from './gemini.service';
import { ConfigModule } from '@nestjs/config';
import { WebSearchModule } from '../web-search/web-search.module';

@Module({
  imports: [
    ConfigModule,
    WebSearchModule,
    HttpModule, // Adicionar HttpModule aos imports
  ],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class GeminiModule {}