import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Bomba } from './bomba.entity';
import { Tablero } from './tablero.entity';
                       
@Entity('estaciones')
export class Estacion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nombre: string; // "Estación de Bombeo Noroccidental"

  @OneToMany(() => Bomba, (bomba) => bomba.estacion)
  bombas: Bomba[];

  @OneToMany(() => Tablero, (tablero) => tablero.estacion)
  tableros: Tablero[];
}