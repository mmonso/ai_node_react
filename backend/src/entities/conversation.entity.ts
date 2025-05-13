import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Message } from './message.entity';
import { Folder } from './folder.entity';

@Entity()
export class Conversation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Message, message => message.conversation, { cascade: true })
  messages: Message[];

  @ManyToOne(() => Folder, folder => folder.conversations, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'folderId' })
  folder: Folder;

  @Column({ type: 'int', nullable: true })
  folderId: number;
}