import { IsString, IsNumber, IsUUID, IsOptional, IsEnum, IsMilitaryTime, Min } from 'class-validator';
import { MomentoVerificacion } from '../entities/verificacion-tablero.entity';

// 1. Valida a los operadores y sus turnos
export class TurnoOperadorDto {
  @IsUUID('4', { message: 'El ID del usuario debe ser un UUID válido' })
  usuario_id: string;

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
    message: 'La hora debe ser un formato de 24 horas válido (HH:mm)' 
  })
  encendido: string;

  @IsString()
  @IsMilitaryTime({ 
    message: 'La hora debe ser un formato de 24 horas válido (HH:mm)' 
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

  @IsEnum(MomentoVerificacion, { message: 'El momento debe ser HABILITACION o DESACTIVACION' })
  momento: MomentoVerificacion;

  @IsString({ message: 'El estado del interruptor debe ser un texto descriptivo' })
  @IsOptional()
  interruptor_estado?: string;
}