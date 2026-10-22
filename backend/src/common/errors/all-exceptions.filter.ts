import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { fail } from '../api/api-envelope';
import { DomainError } from './domain-error';

/**
 * Единственное место, где ошибка превращается в HTTP-статус и конверт.
 * Никаких res.status(...) в контроллерах (codestyle-node §2).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (exception instanceof DomainError) {
      res.status(exception.httpStatus).json(fail(exception.code, exception.details));
      return;
    }

    // Ошибки фреймворка: неизвестный маршрут, битый JSON, слишком большое тело и т.п.
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = status === HttpStatus.BAD_REQUEST ? 'validation_failed' : `http_${status}`;
      res.status(status === HttpStatus.BAD_REQUEST ? 422 : status).json(fail(code));
      return;
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(fail('internal_error'));
  }
}
