import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn, BeforeInsert} from 'typeorm';
import { User } from '../../users/entities/user.entity'; // Importamos al Usuario para la relación

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // "ADMIN", "OPERADOR", "SUPERVISOR"
  @Column({ type: 'varchar', length: 50, unique: true })
  nombre: string;

  // "Tiene acceso total al sistema"
  @Column({ type: 'text', nullable: true })
  descripcion: string;

  // Estado del rol 
  @Column({ type: 'boolean', default: true })
  activo: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // --- RELACIÓN ---
  // Un rol puede tener MUCHOS usuarios
  @OneToMany(() => User, (user) => user.rol)
  usuarios: User[];
}