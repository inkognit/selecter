import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { API_PREFIX, setupApp } from './app.setup';
import { AppConfig } from './core/config/app-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  setupApp(app);
  app.enableShutdownHooks();
  const { port } = app.get(AppConfig);
  await app.listen(port);
  Logger.log(`API: http://localhost:${port}/${API_PREFIX}  Swagger: http://localhost:${port}/api/docs`, 'Bootstrap');
}

void bootstrap();
