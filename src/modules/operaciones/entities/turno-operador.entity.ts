import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { ParteDiario } from './parte-diario.entity';

@Entity('turnos_operadores')
export class TurnoOperador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre_operador: string;

  @Column({ type: 'varchar', length: 50 })
  turno: string; // 'PRIMER', 'SEGUNDO', 'TERCER'

  // RELACIÓN: Muchos turnos pertenecen a un solo Parte Diario
  @ManyToOne(() => ParteDiario, (parteDiario) => parteDiario.operadoresAsignados, {
    onDelete: 'CASCADE', // Si borras el parte, se borran sus turnos automáticamente
  })
  parteDiario: ParteDiario;
}