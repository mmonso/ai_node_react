import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateFolderDto {
  @IsString({ message: 'O nome da pasta deve ser uma string.' })
  @IsNotEmpty({ message: 'O nome da pasta não pode estar vazio.' })
  @MaxLength(100, { message: 'O nome da pasta deve ter no máximo 100 caracteres.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'O prompt do sistema deve ser uma string.' })
  @MaxLength(5000, { message: 'O prompt do sistema deve ter no máximo 5000 caracteres.' })
  systemPrompt?: string;
}