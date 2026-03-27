import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { Estacion } from './estacion.entity';
import { TipoActivo } from './tipo-activo.entity';
import { RegistroActivo } from './registro-activo.entity';

@Entity('activos')
export class Activo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Estacion, (e) => e.activos, { eager: false })
  @JoinColumn({ name: 'estacion_id' })
  estacion: Estacion;

  @Column({ type: 'uuid' })
  estacion_id: string;

  @ManyToOne(() => TipoActivo, { eager: true })
  @JoinColumn({ name: 'tipo_activo_id' })
  tipoActivo: TipoActivo;

  @Column({ type: 'uuid' })
  tipo_activo_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  codigo: string;

  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  numero_serie: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  modelo: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  marca: string;

  @Column({ type: 'date', nullable: true })
  fecha_instalacion: Date;

  @Column({ default: true })
  activo: boolean;

  @Column({ type: 'int', default: 1 })
  orden: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => RegistroActivo, (r) => r.activo)
  registros: RegistroActivo[];
}