import { ValidateNested, IsNotEmptyObject, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ModelDefaultConfigDto } from './model-default-config.dto';

export class UpdateActiveModelConfigDto {
  // Usamos ModelDefaultConfigDto diretamente, pois o corpo da requisição é o próprio objeto de configuração.
  // Para garantir que o objeto não seja vazio e que suas propriedades sejam validadas:
  @IsNotEmptyObject()
  @IsObject() // Garante que é um objeto
  @ValidateNested()
  @Type(() => ModelDefaultConfigDto)
  config: ModelDefaultConfigDto; // O corpo da requisição será mapeado para esta propriedade 'config'
}