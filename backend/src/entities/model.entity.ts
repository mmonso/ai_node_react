import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('models')
export class Model {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  provider: string; // 'openai', 'gemini', 'anthropic', 'deepseek', 'grok'

  @Column()
  name: string; // Nome do modelo

  @Column()
  label: string; // Nome legível para exibição

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'simple-json', nullable: true })
  capabilities: {
    textInput: boolean;
    imageInput: boolean;
    fileInput: boolean;
    webSearch: boolean;
  };

  @Column({ type: 'simple-json', nullable: true })
  defaultConfig: {
    temperature: number;
    topP?: number;
    topK?: number;
    maxOutputTokens: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
} 