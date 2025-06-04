import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Message } from './message.entity';
import { Model } from './model.entity';
import { Folder } from './folder.entity';

@Entity('conversations') // Especificando o nome da tabela explicitamente
@Index(['folderId']) // Adicionando índice para folderId
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ type: 'boolean', default: false })
  isPersona: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, message => message.conversation, { cascade: true })
  messages: Message[];

  @ManyToOne(() => Folder, (folder) => folder.conversations, {
    nullable: true,
    onDelete: 'SET NULL', // Se a pasta for deletada, seta folderId para NULL
  })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @Column({ type: 'int', nullable: true })
  folderId: number | null;

  @ManyToOne(() => Model, { nullable: true, eager: true })
  @JoinColumn({ name: 'modelId' })
  model: Model;

  @Column({ type: 'varchar', nullable: true })
  modelId: string;

  @Column({ type: 'simple-json', nullable: true })
  modelConfig: {
    temperature: number;
    topP?: number;
    topK?: number;
    maxOutputTokens: number;
  };

}