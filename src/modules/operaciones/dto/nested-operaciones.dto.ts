import { IsString, IsNumber, IsUUID, IsOptional, IsEnum, IsMilitaryTime, Min, Matches } from 'class-validator';
import { MomentoVerificacion } from '../entities/verificacion-tablero.entity';

// 1. Valida a los operadores y sus turnos
export class TurnoOperadorDto {

  @IsString({ message: 'El nombre del operador debe ser texto' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El nombre del operador solo puede contener letras, sin números ni caracteres especiales'
  })
  nombre_operador: string;

  @IsNumber({}, { message: 'El turno debe ser un número' })
  @Min(1, { message: 'El turno debe ser al menos 1' })
  numero_turno: number;
}

// 2. Valida las horas de encendido de las bombas
export class DetalleBombeoDto {

  @IsUUID('all', { message: 'El ID de la bomba debe ser un UUID válido' })
  bomba_id: string;

  @IsString()
  @IsMilitaryTime({
    message: 'La hora de encendido debe ser formato 24h válido (HH:mm)'
  })
  encendido: string;

  @IsString()
  @IsMilitaryTime({
    message: 'La hora de apagado debe ser formato 24h válido (HH:mm)'
  })
  apagado: string;

  @IsNumber({}, { message: 'El horómetro inicial debe ser un número' })
  horometro_inicial: number;

  @IsNumber({}, { message: 'El horómetro final debe ser un número' })
  horometro_final: number;

  @IsString()
  @IsOptional()
  observacion?: string;
}

// 3. Valida los checks de los tableros
export class VerificacionTableroDto {

  @IsUUID('all', { message: 'El ID del tablero debe ser un UUID válido' })
  tablero_id: string;

  @IsEnum(MomentoVerificacion, {
    message: 'El momento debe ser HABILITACION o DESACTIVACION'
  })
  momento: MomentoVerificacion;

  @IsString()
  @IsOptional()
  interruptor_estado?: string;

  @IsString()
  @IsOptional()
  selector_estado?: string;

  @IsString()
  @IsOptional()
  parada_emergencia_estado?: string;

  @IsString()
  @IsOptional()
  variador_estado?: string;

  @IsString()
  @IsOptional()
  alarma_estado?: string;
}