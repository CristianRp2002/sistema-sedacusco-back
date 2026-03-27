import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { TipoActivo } from './tipo-activo.entity';

export enum TipoInput {
  NUMERO  = 'numero',
  HORA    = 'hora',
  TEXTO   = 'texto',
  BOOLEANO = 'booleano',
  FECHA   = 'fecha',
}

@Entity('campos_tipo_activo')
export class CampoTipoActivo {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => TipoActivo, (t) => t.campos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tipo_activo_id' })
  tipoActivo: TipoActivo;

  @Column({ type: 'uuid' })
  tipo_activo_id: string;

  // Nombre técnico del campo — sin espacios, ej: "nivel_inicial"
  @Column({ type: 'varchar', length: 100 })
  nombre_campo: string;

  // Etiqueta que ve el operador — ej: "Nivel inicial (m)"
  @Column({ type: 'varchar', length: 150 })
  etiqueta: string;

  // Qué tipo de input se muestra en el formulario
  @Column({ type: 'varchar', length: 20, default: TipoInput.NUMERO })
  tipo_input: TipoInput;

  // ¿El operador está obligado a llenarlo?
  @Column({ default: false })
  requerido: boolean;

  // Orden en que aparece en el formulario
  @Column({ type: 'int', default: 1 })
  orden: number;

  // Unidad de medida opcional — ej: "m", "bar", "kg", "kWh"
  @Column({ type: 'varchar', length: 20, nullable: true })
  unidad: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;
}