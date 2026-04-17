import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { ParteDiario } from './parte-diario.entity';
import { Bomba } from './bomba.entity';

@Entity('detalles_bombeo')
export class DetalleBombeo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //(Bomba 1, Bomba 2, o Bomba 3...)
  @ManyToOne(() => Bomba, {
    onDelete: 'CASCADE'
  })
  bomba: Bomba;

  // TIMESTAMP para guardar fecha Y hora exacta
  @Column({ type: 'timestamp' })
  encendido: Date; 

  @Column({ type: 'timestamp' })
  apagado: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  horometro_inicial: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  horometro_final: number;

  @Column({ type: 'text', nullable: true })
  observacion: string;

  @ManyToOne(() => ParteDiario, (parte) => parte.detallesBombeo, {
    onDelete: 'CASCADE'
  })

  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario: ParteDiario;
}