import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from 'typeorm';
import { Conversation } from './conversation.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @Column()
  isUser: boolean;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @Column({ type: 'text', nullable: true })
  groundingMetadata: string;

  @ManyToOne(() => Conversation, conversation => conversation.messages)
  conversation: Conversation;

  @Column({ nullable: true })
  conversationId: number;
} 