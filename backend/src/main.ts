import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configurar CORS especificamente para suportar SSE/EventSource
  app.enableCors({
    origin: true, // Permite qualquer origem (em produção, especificar domínios permitidos)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'], // Para download de arquivos
    maxAge: 3600, // Cache CORS por 1 hora
  });
  
  app.useGlobalPipes(new ValidationPipe());
  app.setGlobalPrefix('api');
  
  await app.listen(3001);
  console.log(`Aplicação rodando em: http://localhost:3001/`);
}
bootstrap(); 