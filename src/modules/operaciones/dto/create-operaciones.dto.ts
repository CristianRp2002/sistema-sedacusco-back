import { IsDateString, IsUUID, IsArray, ValidateNested, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TurnoOperadorDto, DetalleBombeoDto, VerificacionTableroDto } from './nested-operaciones.dto';

export class CreateOperacionesDto {
  @IsDateString({}, { message: 'La fecha_folio debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  fecha_folio: string;

  @IsUUID('4', { message: 'Debes seleccionar una Estación válida' })
  estacion_id: string;

  @IsNumber({}, { message: 'El totalizador inicial debe ser un número decimal o entero' })
  totalizador_inicial: number;

  @IsNumber({}, { message: 'El totalizador final debe ser un número decimal o entero' })
  totalizador_final: number;

  // --- VALIDACIÓN DE LISTAS ANIDADAS ---

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TurnoOperadorDto)
  operadores: TurnoOperadorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleBombeoDto)
  bombeos: DetalleBombeoDto[];
  
  @IsNumber()
  nivel_cisterna_final: number;

  @IsNumber()
  presion_linea_final: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificacionTableroDto)
  tableros: VerificacionTableroDto[];
}