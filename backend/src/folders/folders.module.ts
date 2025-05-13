import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { Folder } from '../entities/folder.entity';
import { Conversation } from '../entities/conversation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Conversation])],
  controllers: [FoldersController],
  providers: [FoldersService],
})
export class FoldersModule {}