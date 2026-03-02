import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Estacion } from './estacion.entity';

@Entity('tableros')
export class Tablero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string; // Ej: "Tablero General", "Tablero Bomba 1"

  @Column({ type: 'varchar', length: 50, nullable: true })
  tipo: string; // Opcional: Para diferenciar si es de control, telemetría, etc.

  @ManyToOne(() => Estacion)
  @JoinColumn({ name: 'estacion_id' })
  estacion: Estacion;

  @Column({ type: 'boolean', default: true })
  activo: boolean; // Por si un tablero es dado de baja
}