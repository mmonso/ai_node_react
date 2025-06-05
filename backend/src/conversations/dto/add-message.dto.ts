import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsJSON } from 'class-validator';

export class AddMessageDto {
  @ApiProperty({
    description: 'O conteúdo da mensagem.',
    example: 'Olá, como você está?',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    description: 'Configuração do modelo para esta mensagem específica (opcional, como um objeto JSON).',
    example: { temperature: 0.7, maxTokens: 100 },
    required: false,
    type: 'object',
    additionalProperties: true,
  })
  @IsOptional()
  @IsString()
  @IsJSON({ message: 'modelConfig deve ser uma string JSON válida, se fornecido.' })
  modelConfig?: string; // Agora esperamos uma string JSON

  @ApiProperty({
    description: 'Arquivo a ser enviado com a mensagem (opcional).',
    type: 'string',
    format: 'binary',
    required: false,
  })
  @IsOptional()
  file?: any; // O tipo 'any' é usado aqui porque o FileInterceptor lida com o arquivo
}