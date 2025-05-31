import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from '../entities/folder.entity';
import { Conversation } from '../entities/conversation.entity';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Folder, Conversation])],
  controllers: [FoldersController],
  providers: [FoldersService],
  exports: [FoldersService], // Exportando para caso seja necessário em outros módulos
})
export class FoldersModule {}