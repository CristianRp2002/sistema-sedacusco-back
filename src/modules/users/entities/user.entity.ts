import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert} from 'typeorm';
import { Role } from '../../roles/entities/role.entity'; 
import { ParteDiario } from '../../operaciones/entities/parte-diario.entity';
import { ParteDiarioOperador } from '../../operaciones/entities/parte-diario-operador.entity'; 
// 2. Importamos bcrypt para la encriptación
import * as bcrypt from 'bcrypt';

@Entity('usuarios')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  nombre_completo: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ type: 'varchar', select: false })
  password: string;

  @Column({ type: 'boolean', default: true })
  activo: boolean;

  // ==========================================
  // AQUÍ ESTÁ LA MAGIA DEL CASO 2 🔗
  // ==========================================
  
  // Muchos usuarios pueden tener UN mismo rol
  @ManyToOne(() => Role, (role) => role.usuarios, { eager: true }) 
  @JoinColumn({ name: 'rol_id' }) // En la BD se crea la columna 'rol_id'
  rol: Role;

  // TypeORM automáticamente te traerá los datos de su rol (nombre, descripción)

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(() => ParteDiarioOperador, (pdo) => pdo.usuario)
  turnos_cubiertos: ParteDiarioOperador[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      // Generamos una "sal" (ruido aleatorio para hacer el hash más seguro)
      const salt = await bcrypt.genSalt(10);
      // Encriptamos la contraseña plana combinándola con la sal
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}