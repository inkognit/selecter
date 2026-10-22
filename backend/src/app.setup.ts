import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { EnvelopeInterceptor } from './common/api/envelope.interceptor';
import { AllExceptionsFilter } from './common/errors/all-exceptions.filter';
import { RequestValidationError, flattenValidationErrors } from './common/errors/validation-error';
import { AppConfig } from './core/config/app-config';

export const API_PREFIX = 'api/v1';

/** Общая настройка для main.ts и e2e — тесты гоняют ровно то приложение, что и запуск. */
export function setupApp(app: INestApplication): void {
  const config = app.get(AppConfig);
  app.setGlobalPrefix(API_PREFIX);
  app.enableCors({ origin: config.corsOrigins });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => new RequestValidationError(flattenValidationErrors(errors)),
    }),
  );
  app.useGlobalInterceptors(new EnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  const doc = new DocumentBuilder().setTitle('Канбан-доска API').setVersion('1').build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, doc));
}
