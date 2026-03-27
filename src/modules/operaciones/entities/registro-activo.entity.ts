import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { ParteDiario } from './parte-diario.entity';
import { Activo } from './activo.entity';

export enum MomentoRegistro {
  HABILITACION  = 'HABILITACION',
  OPERACION     = 'OPERACION',
  DESACTIVACION = 'DESACTIVACION',
  INICIAL       = 'INICIAL',
  FINAL         = 'FINAL',
}

@Entity('registros_activo')
export class RegistroActivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ParteDiario, (p) => p.registrosActivo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario: ParteDiario;

  @Column({ type: 'uuid' })
  parte_diario_id: string;

  @ManyToOne(() => Activo, (a) => a.registros, { eager: true })
  @JoinColumn({ name: 'activo_id' })
  activo: Activo;

  @Column({ type: 'uuid' })
  activo_id: string;

  @Column({ type: 'varchar', length: 20, default: MomentoRegistro.OPERACION })
  momento: MomentoRegistro;

  @Column({ type: 'varchar', length: 50, nullable: true })
  estado: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  falla: string;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  // BOMBA
  @Column({ type: 'timestamp', nullable: true })
  encendido: Date;

  @Column({ type: 'timestamp', nullable: true })
  apagado: Date;

  @Column({ type: 'numeric', nullable: true })
  horometro_inicial: number;

  @Column({ type: 'numeric', nullable: true })
  horometro_final: number;

  @Column({ type: 'int', nullable: true })
  numero_ciclo: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dias_horas_arranque_ini: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  dias_horas_arranque_fin: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  motor_estado: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  bomba_estado_campo: string;

  // POZO
  @Column({ type: 'numeric', nullable: true })
  nivel_inicial: number;

  @Column({ type: 'numeric', nullable: true })
  nivel_final: number;

  @Column({ type: 'numeric', nullable: true })
  presion_inicial: number;

  @Column({ type: 'numeric', nullable: true })
  presion_final: number;

  @Column({ type: 'bigint', nullable: true })
  totalizador_inicial: number;

  @Column({ type: 'bigint', nullable: true })
  totalizador_final: number;

  @Column({ type: 'boolean', nullable: true })
  caudal_ok: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  interruptor_estado: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  modo: string;

  @Column({ type: 'numeric', nullable: true })
  valv_principal_pct: number;

  @Column({ type: 'numeric', nullable: true })
  contador_celda_inicio: number;

  @Column({ type: 'numeric', nullable: true })
  contador_celda_final: number;

  @Column({ type: 'numeric', nullable: true })
  produccion_pozo: number;

  // TABLERO
  @Column({ type: 'varchar', length: 50, nullable: true })
  interruptor: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  selector: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  parada_emergencia: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  variador: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  alarma: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  telemetria: string;

  @Column({ type: 'numeric', nullable: true })
  presion_ingreso: number;

  // VÁLVULA
  @Column({ type: 'numeric', nullable: true })
  apertura_pct: number;

  // RELÉ
  @Column({ type: 'varchar', length: 50, nullable: true })
  rele_estado: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  rele_falla: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  tpu_estado: string;

  // CILINDRO CLORO
  @Column({ type: 'numeric', nullable: true })
  peso_inicial_kg: number;

  @Column({ type: 'numeric', nullable: true })
  peso_final_kg: number;

  @Column({ type: 'numeric', nullable: true })
  consumo_kg: number;

  // CELDA ELÉCTRICA
  @Column({ type: 'time', nullable: true })
  celda_hora: string;

  @Column({ type: 'numeric', nullable: true })
  celda_v4_16kv: number;

  @Column({ type: 'numeric', nullable: true })
  celda_b1: number;

  @Column({ type: 'numeric', nullable: true })
  celda_b2: number;

  @Column({ type: 'numeric', nullable: true })
  celda_socorro: number;

  @Column({ type: 'numeric', nullable: true })
  celda_reserva1: number;

  @Column({ type: 'numeric', nullable: true })
  celda_reserva2: number;

  @Column({ type: 'numeric', nullable: true })
  celda_reserva3: number;

  @Column({ type: 'numeric', nullable: true })
  celda_salida_eb1: number;

  @Column({ type: 'int', nullable: true })
  celda_estado: number;

  // CISTERNA
  @Column({ type: 'numeric', nullable: true })
  nivel: number;

  @Column({ type: 'numeric', nullable: true })
  presion_tanque: number;

  // MEDIDOR
  @Column({ type: 'bigint', nullable: true })
  lectura_totalizador: number;

  @CreateDateColumn()
  created_at: Date;
}