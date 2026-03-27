import {
  IsDateString, IsUUID, IsArray, ValidateNested,
  IsNotEmpty, IsNumber, IsOptional, IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TurnoOperadorDto,
  DetalleBombeoDto,
  VerificacionTableroDto,
  RegistroActivoDto,
} from './nested-operaciones.dto';

export class CreateOperacionesDto {

  @IsDateString({}, { message: 'La fecha_folio debe ser una fecha válida (ISO 8601)' })
  @IsNotEmpty({ message: 'La fecha es obligatoria' })
  fecha_folio: string;

  // Fecha hasta — para fichas de doble turno (ej: Qollana del 09 al 10)
  @IsDateString()
  @IsOptional()
  fecha_hasta?: string;

  @IsUUID('4', { message: 'Debes seleccionar una Estación válida' })
  estacion_id: string;

  @IsNumber({}, { message: 'El totalizador inicial debe ser un número' })
  totalizador_inicial: number;

  @IsNumber({}, { message: 'El totalizador final debe ser un número' })
  totalizador_final: number;

  @IsNumber() @IsOptional()
  nivel_cisterna_final?: number;

  @IsNumber() @IsOptional()
  presion_linea_final?: number;

  // ── Sección I — Noroccidental ─────────────────────────────────────────────
  @IsString() @IsOptional()
  interruptor_llegada_10kv_estado?: string;

  @IsNumber() @IsOptional()
  transformador_temperatura?: number;

  @IsOptional()
  tension_llegada?: { fase_R?: number; fase_S?: number; fase_T?: number };

  @IsOptional()
  tension_tablero?: { fase_R?: number; fase_S?: number; fase_T?: number };

  // ── Sección I — Piñapampa / Qollana ──────────────────────────────────────
  @IsNumber() @IsOptional() kv_rs?: number;
  @IsNumber() @IsOptional() kv_st?: number;
  @IsNumber() @IsOptional() kv_tr?: number;

  @IsString() @IsOptional() rele_buchols_condicion?: string;
  @IsString() @IsOptional() rele_buchols_falla?: string;
  @IsString() @IsOptional() rele_diferencial_estado?: string;
  @IsString() @IsOptional() rele_siaparo_condicion?: string;
  @IsString() @IsOptional() rele_siaparo_falla?: string;
  @IsString() @IsOptional() tablero_110vcd_estado?: string;
  @IsString() @IsOptional() rectificador_estado?: string;
  @IsString() @IsOptional() equipos_estado?: string;
  @IsString() @IsOptional() batt_estado?: string;
  @IsString() @IsOptional() cuadro_fallas_n1?: string;
  @IsString() @IsOptional() cuadro_fallas_n2?: string;

  // ── Sección III / V — Lecturas hidráulicas ────────────────────────────────
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

  // Tanque ariete — Qollana
  @IsNumber() @IsOptional() presion_tanque_ariete_ini?: number;
  @IsNumber() @IsOptional() presion_tanque_ariete_fin?: number;

  // ── Sección II / VI — Condiciones ─────────────────────────────────────────
  @IsOptional()
  condicion_habilitacion?: { estado_telemetria?: string; presion_ingreso?: number };

  @IsOptional()
  condicion_desactivacion?: { estado_telemetria?: string; presion_ingreso?: number };

  // ── Producción / horas ────────────────────────────────────────────────────
  @IsNumber() @IsOptional() produccion_total_m3?: number;
  @IsNumber() @IsOptional() horas_bombeo_total?: number;
  @IsNumber() @IsOptional() cloro_total_kg?: number;
  @IsNumber() @IsOptional() totalizador_general_ini?: number;
  @IsNumber() @IsOptional() totalizador_general_fin?: number;

  // ── Arrays existentes ─────────────────────────────────────────────────────
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

  // ── NUEVO — registros de activos (Piñapampa / Qollana) ────────────────────
  // Array opcional — si viene vacío o no viene, Noroccidental sigue igual
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => RegistroActivoDto)
  registros_activo?: RegistroActivoDto[];
}
