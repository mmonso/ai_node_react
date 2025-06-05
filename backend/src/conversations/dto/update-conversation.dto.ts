import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateConversationDto {
  @ApiProperty({
    description: 'O novo título da conversa.',
    example: 'Conversa Atualizada sobre IA',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Indica se esta conversa é uma persona (opcional).',
    example: true,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isPersona?: boolean;

  @ApiProperty({
    description: 'O novo prompt de sistema para a conversa (opcional, pode ser nulo para remover).',
    example: 'Você é um especialista em NestJS.',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string | null;
}