import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ParteDiario } from './parte-diario.entity';

@Entity('partes_diarios_operadores')
export class ParteDiarioOperador {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int' }) // 1, 2 o 3
  numero_turno: number;

  @ManyToOne(() => ParteDiario, (parte) => parte.operadoresAsignados, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario: ParteDiario;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}