import { IsNumber, IsOptional, Min, Max } from 'class-validator';

export class ModelDefaultConfigDto {
  @IsNumber()
  @Min(0)
  @Max(2) // Exemplo de valor máximo, ajuste conforme necessário
  temperature: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1) // Exemplo de valor máximo, ajuste conforme necessário
  topP?: number;

  @IsNumber()
  @IsOptional()
  @Min(1) // Exemplo de valor mínimo, ajuste conforme necessário
  topK?: number;

  @IsNumber()
  @Min(1) // Exemplo de valor mínimo, ajuste conforme necessário
  maxOutputTokens: number;
}