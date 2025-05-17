import { Module } from '@nestjs/common';
import { WebSearchService } from './web-search.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [WebSearchService],
  exports: [WebSearchService],
})
export class WebSearchModule {} 