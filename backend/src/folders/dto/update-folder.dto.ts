import { IsString, IsOptional, MaxLength, IsNotEmpty } from 'class-validator';

// Não usaremos PartialType para evitar problemas de dependência com @nestjs/mapped-types
// e a versão atual do @nestjs/common e class-validator.
// Definimos os campos como opcionais manualmente.

export class UpdateFolderDto {
  @IsOptional()
  @IsString({ message: 'O nome da pasta deve ser uma string.' })
  @IsNotEmpty({ message: 'O nome da pasta não pode estar vazio, se fornecido.' })
  @MaxLength(100, { message: 'O nome da pasta deve ter no máximo 100 caracteres.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'O prompt do sistema deve ser uma string.' })
  @MaxLength(5000, { message: 'O prompt do sistema deve ter no máximo 5000 caracteres.' })
  systemPrompt?: string;
}