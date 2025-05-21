import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('models')
export class Model {
  @PrimaryColumn()
  id: string;

  @Column()
  provider: string; // 'openai', 'gemini', 'anthropic', 'deepseek', 'grok'

  @Column()
  name: string; // Nome do modelo

  @Column()
  label: string; // Nome legível para exibição

  @Column()
  isAvailable: boolean;

  @Column('simple-json')
  capabilities: {
    textInput: boolean;
    imageInput: boolean;
    fileInput: boolean;
    webSearch: boolean;
    tool_use?: boolean; // Adicionada capacidade para uso de ferramentas/funções
  };

  @Column('simple-json')
  defaultConfig: {
    temperature: number;
    topP?: number;
    topK?: number;
    maxOutputTokens: number;
  };

  @Column({ type: 'datetime', nullable: true })
  lastSeenAt: Date | null;

  @Column({ type: 'datetime', nullable: true })
  markedAsMissingSince: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}