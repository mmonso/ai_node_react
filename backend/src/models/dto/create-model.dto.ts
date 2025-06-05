import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsDate, // Alterado de IsDateString
  ValidateNested,
  IsIn,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ModelCapabilitiesDto } from './model-capabilities.dto';
import { ModelDefaultConfigDto } from './model-default-config.dto';

const validProviders = ['openai', 'gemini', 'anthropic', 'deepseek', 'grok'] as const;

export class CreateModelDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ description: "ID único do modelo", example: "gemini-1.5-pro-latest" })
  id: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(validProviders)
  @ApiProperty({ description: "Provedor do modelo", enum: validProviders, example: "gemini" })
  provider: typeof validProviders[number];

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ description: "Nome técnico do modelo", example: "Gemini 1.5 Pro" })
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @ApiProperty({ description: "Rótulo de exibição do modelo", example: "Gemini 1.5 Pro (Latest)" })
  label: string;

  @IsBoolean()
  @ApiProperty({ description: "Indica se o modelo está disponível para uso", example: true })
  isAvailable: boolean;

  @ValidateNested()
  @Type(() => ModelCapabilitiesDto)
  @IsNotEmpty()
  @ApiProperty({ type: () => ModelCapabilitiesDto, description: "Capacidades do modelo" })
  capabilities: ModelCapabilitiesDto;

  @ValidateNested()
  @Type(() => ModelDefaultConfigDto)
  @IsNotEmpty()
  @ApiProperty({ type: () => ModelDefaultConfigDto, description: "Configurações padrão do modelo" })
  defaultConfig: ModelDefaultConfigDto;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ description: "Data da última vez que o modelo foi visto/sincronizado (formato ISO string)", example: "2024-05-15T10:00:00.000Z", required: false, type: String, format: 'date-time', nullable: true })
  lastSeenAt?: Date | null;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ description: "Data desde quando o modelo foi marcado como ausente (formato ISO string)", example: "2024-05-16T10:00:00.000Z", required: false, type: String, format: 'date-time', nullable: true })
  markedAsMissingSince?: Date | null;
}