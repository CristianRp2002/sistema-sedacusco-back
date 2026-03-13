import { IsDateString, IsUUID, IsArray, ValidateNested, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TurnoOperadorDto, DetalleBombeoDto, VerificacionTableroDto } from './nested-operaciones.dto';

export class CreateOperacionesDto {

  @IsDateString({}, { message: 'La fecha_folio debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  fecha_folio: string;

  @IsUUID('4', { message: 'Debes seleccionar una Estación válida' })
  estacion_id: string;

  @IsNumber({}, { message: 'El totalizador inicial debe ser un número' })
  totalizador_inicial: number;

  @IsNumber({}, { message: 'El totalizador final debe ser un número' })
  totalizador_final: number;

  @IsNumber()
  @IsOptional()
  nivel_cisterna_final?: number;

  @IsNumber()
  @IsOptional()
  presion_linea_final?: number;

  // Sección I
  @IsString()
  @IsOptional()
  interruptor_llegada_10kv_estado?: string;

  @IsNumber()
  @IsOptional()
  transformador_temperatura?: number;

  @IsOptional()
  tension_llegada?: { fase_R?: number; fase_S?: number; fase_T?: number };

  @IsOptional()
  tension_tablero?: { fase_R?: number; fase_S?: number; fase_T?: number };

  // Sección III y V
  @IsOptional()
  lectura_inicial?: {
    hora_registro?: string;
    nivel_cisterna?: number;
    presion_linea?: number;
    presion_jatun_huaylla?: number;
    totalizador?: number;
  };

  @IsOptional()
  lectura_final?: {
    hora_registro?: string;
    nivel_cisterna?: number;
    presion_linea?: number;
    presion_jatun_huaylla?: number;
    totalizador?: number;
  };

  // Sección II y VI
  @IsOptional()
  condicion_habilitacion?: { estado_telemetria?: string; presion_ingreso?: number };

  @IsOptional()
  condicion_desactivacion?: { estado_telemetria?: string; presion_ingreso?: number };

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TurnoOperadorDto)
  operadores: TurnoOperadorDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleBombeoDto)
  bombeos: DetalleBombeoDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VerificacionTableroDto)
  tableros: VerificacionTableroDto[];
}