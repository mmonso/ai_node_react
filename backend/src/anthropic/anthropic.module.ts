import { Module } from '@nestjs/common';
import { AnthropicService } from './anthropic.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [AnthropicService],
  exports: [AnthropicService],
})
export class AnthropicModule {} 