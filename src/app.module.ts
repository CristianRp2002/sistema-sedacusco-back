import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// --- 1. IMPORTA LAS ENTIDADES FÍSICAMENTE ---
// Revisa que estas rutas sean las correctas en tu proyecto
import { User } from './modules/users/entities/user.entity';
import { Role } from './modules/roles/entities/role.entity';
import { ParteDiario } from './modules/operaciones/entities/parte-diario.entity';

// --- IMPORTAMOS LOS MÓDULOS ---
import { OperacionesModule } from './modules/operaciones/operaciones.module';
import { UsersModule } from './modules/users/users.module'; 
import { RolesModule } from './modules/roles/roles.module'; 
import { AuthModule } from './modules/auth/auth.module';
import { PdfModule } from './pdf/pdf.module';

@Module({
  imports: [
    PdfModule,
    // 1. Configuración Global
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2. Base de Datos (Configuración Reforzada)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USER'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        
        // --- CAMBIO PRO: REGISTRO EXPLÍCITO ---
        // Esto obliga a TypeORM a cargar las clases antes de validar las relaciones
        entities: [User, Role, ParteDiario], 
        
        autoLoadEntities: true, 
        synchronize: true, 
        
        // Añadimos esto para debuguear en consola qué está pasando exactamente
        logging: ['error', 'warn'], 
      }),
    }),

    // 3. REGISTRO DE MÓDULOS
    OperacionesModule,
    UsersModule, 
    RolesModule, AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}