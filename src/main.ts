import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // 1. Importamos el validador
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 2. ACTIVAR LA SEGURIDAD GLOBAL
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Descarta automáticamente campos que no estén en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían campos "intrusos"
    transform: true,            // Convierte los datos al tipo de dato que pusimos en el DTO
  }));
  app.enableCors();
  // Mantenemos tu configuración de puerto
  await app.listen(process.env.PORT ?? 3000);
  
  console.log(`🚀 Servidor corriendo en: http://localhost:3000`);
}
bootstrap();