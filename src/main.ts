import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();

  // Swagger/OpenAPI documentation
  const config = new DocumentBuilder()
    .setTitle('MeetMeAt API')
    .setDescription(
      'Conference poster generator API - Create branded "I\'m attending" posters for social media',
    )
    .setVersion('1.0')
    .addTag('profiles', 'User profile management')
    .addTag('events', 'Event parsing and management')
    .addTag('templates', 'AI-generated poster templates')
    .addTag('posters', 'Poster creation and export')
    .addTag('health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
