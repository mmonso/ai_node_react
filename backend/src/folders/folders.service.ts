import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../entities/folder.entity';
import { Conversation } from '../entities/conversation.entity';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';

@Injectable()
export class FoldersService {
  constructor(
    @InjectRepository(Folder)
    private readonly folderRepository: Repository<Folder>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  async create(createFolderDto: CreateFolderDto, userId: string): Promise<Folder> {
    const newFolder = this.folderRepository.create({
      ...createFolderDto,
      userId,
    });
    return this.folderRepository.save(newFolder);
  }

  async findAll(userId: string): Promise<Folder[]> {
    return this.folderRepository.find({
      where: { userId },
      order: { updatedAt: 'DESC' }, // Ordenar por mais recente
    });
  }

  async findOne(id: number, userId: string): Promise<Folder> {
    const folder = await this.folderRepository.findOne({
      where: { id, userId },
      // relations: ['conversations'], // Opcional: carregar conversas associadas
    });
    if (!folder) {
      throw new NotFoundException(`Pasta com ID ${id} não encontrada ou não pertence ao usuário.`);
    }
    return folder;
  }

  async update(id: number, updateFolderDto: UpdateFolderDto, userId: string): Promise<Folder> {
    // Primeiro, verifica se a pasta existe e pertence ao usuário
    const folderToUpdate = await this.findOne(id, userId);

    // Mescla as alterações do DTO na entidade existente
    // O TypeORM é inteligente o suficiente para atualizar apenas os campos fornecidos
    Object.assign(folderToUpdate, updateFolderDto);
    
    return this.folderRepository.save(folderToUpdate);
  }

  async remove(id: number, userId: string): Promise<void> {
    const folderToRemove = await this.findOne(id, userId); // Garante que a pasta existe e pertence ao usuário

    // Antes de remover a pasta, desassociar todas as conversas que pertencem a ela.
    // Isso define folderId como null para essas conversas.
    await this.conversationRepository.update(
      { folderId: id }, // Critério: todas as conversas com este folderId
      { folderId: null }, // Atualização: definir folderId como null
    );

    // Agora remove a pasta
    const result = await this.folderRepository.delete({ id, userId });

    if (result.affected === 0) {
      // Isso não deveria acontecer se findOne não lançou erro, mas é uma checagem extra.
      throw new NotFoundException(`Pasta com ID ${id} não encontrada para remoção.`);
    }
  }
}