import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity('folders')
@Index(['userId']) // Adicionando índice para userId para otimizar buscas por usuário
export class Folder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string | null;

  @Column()
  userId: string; // Assumindo que o ID do usuário é uma string

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Conversation, (conversation) => conversation.folder, {
    // onDelete: 'SET NULL', // Se uma pasta for deletada, as conversas nela terão folderId = null
    // cascade: false, // Não deletar conversas em cascata
  })
  conversations: Conversation[];
}