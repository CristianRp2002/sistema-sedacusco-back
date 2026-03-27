import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, OneToMany,
} from 'typeorm';
import { Activo } from './activo.entity';
import { CampoTipoActivo } from './campo-tipo-activo.entity';

@Entity('tipos_activo')
export class TipoActivo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  codigo: string;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => Activo, (a) => a.tipoActivo)
  activos: Activo[];

  // ← NUEVO
  @OneToMany(() => CampoTipoActivo, (c) => c.tipoActivo)
  campos: CampoTipoActivo[];
}