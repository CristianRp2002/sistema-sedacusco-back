import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperacionesService } from './operaciones.service';
import { OperacionesController } from './operaciones.controller';
import { EstacionesService } from './estaciones.service';
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

import { TipoActivo }    from './entities/tipo-activo.entity';
import { Activo }        from './entities/activo.entity';
import { RegistroActivo } from './entities/registro-activo.entity';

import { CampoTipoActivo }     from './entities/campo-tipo-activo.entity';
import { ValorRegistro }       from './entities/valor-registro.entity';

import { CamposService }    from './campos.service';
import { CamposController } from './campos.controller';

import { ValoresRegistroService }    from './valores-registro.service';
import { ValoresRegistroController } from './valores-registro.controller';
import { ActivosController } from './activos.controller';
import { ActivosService } from './activos.service';
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
      ParteDiarioOperador,
      TipoActivo,
      Activo,
      RegistroActivo,

      CampoTipoActivo,   
      ValorRegistro
    ])
  ],
  controllers: [OperacionesController, EstacionesController, ActivosController, CamposController, ValoresRegistroController,],
  providers: [OperacionesService,ActivosService, CamposService, ValoresRegistroService, EstacionesService],
  exports: [OperacionesService, TypeOrmModule]
})
export class OperacionesModule {}