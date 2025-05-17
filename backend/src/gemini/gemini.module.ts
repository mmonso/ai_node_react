import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ConfigModule } from '@nestjs/config';
import { WebSearchModule } from '../web-search/web-search.module';

@Module({
  imports: [ConfigModule, WebSearchModule],
  providers: [GeminiService],
  exports: [GeminiService]
})
export class GeminiModule {} 