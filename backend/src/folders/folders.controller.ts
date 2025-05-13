import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { FoldersService } from './folders.service';
import { Folder } from '../entities/folder.entity';
import { Conversation } from '../entities/conversation.entity';

// DTOs for request body validation (optional but good practice)
class CreateFolderDto {
  name: string;
}

class UpdateFolderDto {
  name: string;
}

class AddConversationToFolderDto {
  conversationId: number;
}

@Controller('folders')
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createFolderDto: CreateFolderDto): Promise<Folder> {
    return this.foldersService.createFolder(createFolderDto.name);
  }

  @Get()
  findAll(): Promise<Folder[]> {
    return this.foldersService.findAllFolders();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Folder> {
    return this.foldersService.findFolderById(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateFolderDto: UpdateFolderDto): Promise<Folder> {
    return this.foldersService.updateFolder(id, updateFolderDto.name);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.foldersService.deleteFolder(id);
  }

  @Post(':folderId/conversations')
  @HttpCode(HttpStatus.OK) // Or CREATED if you prefer for adding a sub-resource link
  addConversationToFolder(
    @Param('folderId', ParseIntPipe) folderId: number,
    @Body() addConversationDto: AddConversationToFolderDto,
  ): Promise<Conversation> {
    return this.foldersService.addConversationToFolder(folderId, addConversationDto.conversationId);
  }

  @Delete('conversations/:conversationId')
  @HttpCode(HttpStatus.OK)
  removeConversationFromFolder(
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ): Promise<Conversation> {
    return this.foldersService.removeConversationFromFolder(conversationId);
  }
}