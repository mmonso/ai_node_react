import {
  IsString,
  IsOptional,
  IsBoolean,
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

export class UpdateModelDto {
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(255)
  @ApiProperty({ description: "ID único do modelo", example: "gemini-1.5-pro-latest", required: false })
  id?: string;

  @IsString()
  @IsOptional()
  @IsIn(validProviders)
  @ApiProperty({ description: "Provedor do modelo", enum: validProviders, example: "gemini", required: false })
  provider?: typeof validProviders[number];

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({ description: "Nome técnico do modelo", example: "Gemini 1.5 Pro", required: false })
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({ description: "Rótulo de exibição do modelo", example: "Gemini 1.5 Pro (Latest)", required: false })
  label?: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ description: "Indica se o modelo está disponível para uso", example: true, required: false })
  isAvailable?: boolean;

  @ValidateNested()
  @Type(() => ModelCapabilitiesDto)
  @IsOptional()
  @ApiProperty({ type: () => ModelCapabilitiesDto, description: "Capacidades do modelo", required: false })
  capabilities?: ModelCapabilitiesDto;

  @ValidateNested()
  @Type(() => ModelDefaultConfigDto)
  @IsOptional()
  @ApiProperty({ type: () => ModelDefaultConfigDto, description: "Configurações padrão do modelo", required: false })
  defaultConfig?: ModelDefaultConfigDto;

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