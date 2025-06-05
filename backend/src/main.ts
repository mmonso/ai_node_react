import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn'], // Adicionado para reduzir logs do NestJS
  });
  
  // Configurar CORS especificamente para suportar SSE/EventSource
  app.enableCors({
    origin: true, // Permite qualquer origem (em produção, especificar domínios permitidos)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    exposedHeaders: ['Content-Disposition'], // Para download de arquivos
    maxAge: 3600, // Cache CORS por 1 hora
  });
  
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new AllExceptionsFilter());
  app.setGlobalPrefix('api');

  // Configuração do Swagger
  const config = new DocumentBuilder()
    .setTitle('Chat API')
    .setDescription('Documentação da API do Chatbot')
    .setVersion('1.0')
    .addBearerAuth() // Se você usa autenticação Bearer
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3001);
  console.log(`Aplicação rodando em: http://localhost:3001/`);
}
bootstrap(); 