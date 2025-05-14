import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [ConfigModule],
  providers: [GeminiService],
  exports: [GeminiService]
})
export class GeminiModule {} 