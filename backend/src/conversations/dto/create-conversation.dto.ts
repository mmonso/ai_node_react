import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({
    description: 'O título da conversa.',
    example: 'Nova Conversa sobre IA',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'ID do modelo a ser usado para esta conversa (opcional).',
    example: 'gemini-pro',
    required: false,
  })
  @IsOptional()
  @IsString()
  modelId?: string;

  @ApiProperty({
    description: 'Prompt de sistema para a conversa (opcional).',
    example: 'Você é um assistente prestativo.',
    required: false,
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({
    description: 'Indica se esta conversa é uma persona (opcional, padrão: false).',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isPersona?: boolean;
}