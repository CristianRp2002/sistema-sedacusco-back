import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ParteDiario } from './parte-diario.entity';
import { Tablero } from './tablero.entity'

export enum MomentoVerificacion {
  HABILITACION = 'HABILITACION',   
  DESACTIVACION = 'DESACTIVACION', 
}

@Entity('verificaciones_tableros')
export class VerificacionTablero {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: MomentoVerificacion })
  momento: MomentoVerificacion;

  // --- COLUMNAS DE LA CUADRÍCULA ---
  
  @Column({ type: 'varchar', length: 20, nullable: true })
  interruptor_estado: string; // Check o Estado

  @Column({ type: 'varchar', length: 20, nullable: true })
  selector_estado: string; // "Manual", "Automático"

  @Column({ type: 'varchar', length: 20, nullable: true })
  parada_emergencia_estado: string; // Check

  @Column({ type: 'varchar', length: 20, nullable: true })
  variador_estado: string; // "OK", "Falla"

  @Column({ type: 'varchar', length: 50, nullable: true })
  alarma_estado: string; // "--" o descripción de la alarma

  // RELACIONES
  @ManyToOne(() => Tablero, { eager: true }) // eager: true para traer el nombre siempre
  @JoinColumn({ name: 'tablero_id' }) 
  tablero: Tablero;

  @ManyToOne(() => ParteDiario, (parte) => parte.verificacionesTablero, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario: ParteDiario;
}