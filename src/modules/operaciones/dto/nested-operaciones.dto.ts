import {
  IsString, IsNumber, IsUUID, IsOptional,
  IsEnum, IsMilitaryTime, Min, Matches,
  IsBoolean, IsInt, IsDateString,
} from 'class-validator';
import { MomentoVerificacion } from '../entities/verificacion-tablero.entity';

// ── EXISTENTES — NO SE MODIFICAN ─────────────────────────────────────────────

export class TurnoOperadorDto {
  @IsString({ message: 'El nombre del operador debe ser texto' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/, {
    message: 'El nombre solo puede contener letras',
  })
  nombre_operador: string;

  @IsNumber({}, { message: 'El turno debe ser un número' })
  @Min(1, { message: 'El turno debe ser al menos 1' })
  numero_turno: number;

  // Nuevos campos opcionales para Piñapampa/Qollana
  @IsNumber()
  @IsOptional()
  horas_trabajadas?: number;

  @IsNumber()
  @IsOptional()
  horas_bombeo?: number;

  @IsNumber()
  @IsOptional()
  produccion_turno_m3?: number;
}

export class DetalleBombeoDto {
  @IsUUID('all', { message: 'El ID de la bomba debe ser un UUID válido' })
  bomba_id: string;

  @IsString()
  @IsMilitaryTime({ message: 'Encendido debe ser formato 24h (HH:mm)' })
  encendido: string;

  @IsString()
  @IsMilitaryTime({ message: 'Apagado debe ser formato 24h (HH:mm)' })
  apagado: string;

  @IsNumber({}, { message: 'El horómetro inicial debe ser un número' })
  horometro_inicial: number;

  @IsNumber({}, { message: 'El horómetro final debe ser un número' })
  horometro_final: number;

  @IsString()
  @IsOptional()
  observacion?: string;

  // Nuevos campos opcionales para Qollana
  @IsInt()
  @IsOptional()
  numero_ciclo?: number;

  @IsString()
  @IsOptional()
  dias_horas_ini?: string;          // horómetro acumulado inicio

  @IsString()
  @IsOptional()
  dias_horas_fin?: string;          // horómetro acumulado final

  @IsString()
  @IsOptional()
  estado_inicio?: string;

  @IsString()
  @IsOptional()
  estado_final?: string;
}

export class VerificacionTableroDto {
  @IsUUID('all', { message: 'El ID del tablero debe ser un UUID válido' })
  tablero_id: string;

  @IsEnum(MomentoVerificacion, {
    message: 'El momento debe ser HABILITACION o DESACTIVACION',
  })
  momento: MomentoVerificacion;

  @IsString() @IsOptional() interruptor_estado?: string;
  @IsString() @IsOptional() selector_estado?: string;
  @IsString() @IsOptional() parada_emergencia_estado?: string;
  @IsString() @IsOptional() variador_estado?: string;
  @IsString() @IsOptional() alarma_estado?: string;
}

// ── NUEVO — Registro de activo (Piñapampa / Qollana) ─────────────────────────
// Un registro = el estado de UN equipo físico en UN parte diario
// El activo_id identifica qué equipo es (pozo, rele, válvula, celda, cilindro...)

// ── NUEVO — Registro de activo con campos dinámicos ───────────────────────────
export class RegistroActivoDto {
  @IsUUID()
  activo_id: string;

  @IsUUID()
  campo_id: string;

  @IsString()
  @IsOptional()
  valor?: string;
}