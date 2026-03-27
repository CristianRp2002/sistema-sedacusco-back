import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { ParteDiario } from './parte-diario.entity';
import { Activo } from './activo.entity';
import { CampoTipoActivo } from './campo-tipo-activo.entity';

@Entity('valores_registro')
export class ValorRegistro {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  // A qué parte diario pertenece este valor
  @ManyToOne(() => ParteDiario, (p) => p.valoresRegistro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parte_diario_id' })
  parteDiario: ParteDiario;

  @Column({ type: 'uuid' })
  parte_diario_id: string;

  // De qué equipo físico es este valor
  @ManyToOne(() => Activo, { eager: true })
  @JoinColumn({ name: 'activo_id' })
  activo: Activo;

  @Column({ type: 'uuid' })
  activo_id: string;

  // Qué campo está llenando el operador
  @ManyToOne(() => CampoTipoActivo, { eager: true })
  @JoinColumn({ name: 'campo_id' })
  campo: CampoTipoActivo;

  @Column({ type: 'uuid' })
  campo_id: string;

  // El valor que ingresó el operador — siempre texto
  // En el frontend se convierte al tipo correcto según campo.tipo_input
  @Column({ type: 'text', nullable: true })
  valor: string;

  @CreateDateColumn()
  created_at: Date;
}
