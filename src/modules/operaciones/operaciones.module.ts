import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { EstacionesController } from './estaciones.controller';

// Entidades
import { ParteDiario } from './entities/parte-diario.entity';
import { DetalleBombeo } from './entities/detalle-bombeo.entity';
import { TurnoOperador } from './entities/turno-operador.entity';
import { VerificacionTablero } from './entities/verificacion-tablero.entity';
import { Estacion } from './entities/estacion.entity';
import { Bomba } from './entities/bomba.entity';
import { Tablero } from './entities/tablero.entity';
import { ParteDiarioOperador } from './entities/parte-diario-operador.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParteDiario,
      DetalleBombeo,
      TurnoOperador,
      VerificacionTablero,
      Estacion,
      Bomba,
      Tablero,
      ParteDiarioOperador
    ])
  ],
  controllers: [OperacionesController, EstacionesController],
  providers: [OperacionesService],
  exports: [OperacionesService, TypeOrmModule]
})
export class OperacionesModule {}