import { IsBoolean, IsOptional } from 'class-validator';

export class ModelCapabilitiesDto {
  @IsBoolean()
  textInput: boolean;

  @IsBoolean()
  imageInput: boolean;

  @IsBoolean()
  fileInput: boolean;

  @IsBoolean()
  webSearch: boolean;

  @IsBoolean()
  @IsOptional()
  tool_use?: boolean;
}