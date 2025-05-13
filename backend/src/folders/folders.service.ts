import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../entities/folder.entity';
import { Conversation } from '../entities/conversation.entity';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private foldersRepository: Repository<Folder>,
    @InjectRepository(Conversation)
    private conversationsRepository: Repository<Conversation>,
  ) {}

  async createFolder(name: string): Promise<Folder> {
    const folder = this.foldersRepository.create({ name });
    return this.foldersRepository.save(folder);
  }

  async findAllFolders(): Promise<Folder[]> {
    return this.foldersRepository.find({ relations: ['conversations'] });
  }

  async findFolderById(id: number): Promise<Folder> {
    const folder = await this.foldersRepository.findOne({
      where: { id },
      relations: ['conversations'],
    });
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }
    return folder;
  }

  async updateFolder(id: number, name: string): Promise<Folder> {
    const folder = await this.findFolderById(id); // Reuses validation
    folder.name = name;
    return this.foldersRepository.save(folder);
  }

  async deleteFolder(id: number): Promise<void> {
    const folder = await this.findFolderById(id); // Reuses validation

    // Move conversations to root before deleting folder
    if (folder.conversations && folder.conversations.length > 0) {
      for (const conversation of folder.conversations) {
        conversation.folder = null;
        conversation.folderId = null;
        await this.conversationsRepository.save(conversation);
      }
    }
    await this.foldersRepository.delete(id);
  }

  async addConversationToFolder(folderId: number, conversationId: number): Promise<Conversation> {
    const folder = await this.findFolderById(folderId);
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    conversation.folder = folder;
    // conversation.folderId = folder.id; // TypeORM handles this automatically with the relation
    return this.conversationsRepository.save(conversation);
  }

  async removeConversationFromFolder(conversationId: number): Promise<Conversation> {
    const conversation = await this.conversationsRepository.findOneBy({ id: conversationId });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${conversationId} not found`);
    }

    conversation.folder = null;
    // conversation.folderId = null; // TypeORM handles this automatically
    return this.conversationsRepository.save(conversation);
  }
}