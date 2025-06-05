import { IsString, IsNotEmpty, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelDefaultConfigDto } from './model-default-config.dto';

export class SetActiveModelDto {
  @IsString()
  @IsNotEmpty()
  modelId: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ModelDefaultConfigDto)
  modelConfig?: ModelDefaultConfigDto;
}