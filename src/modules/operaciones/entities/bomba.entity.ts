import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Estacion } from './estacion.entity';

@Entity('bombas')
export class Bomba {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column()
  nombre: string; // "Electro Bomba N° 1"

  @Column({ type: 'boolean', default: true })
  activa: boolean;

  @ManyToOne(() => Estacion, (estacion) => estacion.bombas)
  estacion: Estacion;

}