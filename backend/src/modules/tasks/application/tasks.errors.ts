import { DomainError } from '../../../common/errors/domain-error';

export class TaskNotFoundError extends DomainError {
  readonly code = 'task_not_found';
  readonly httpStatus = 404;

  constructor(readonly taskId: string) {
    super(`task_not_found: ${taskId}`);
  }
}

/** Нарушена уникальность позиции в колонке (SQLSTATE 23505) — последний рубеж БД (docs/DB.md §3). */
export class TaskConflictError extends DomainError {
  readonly code = 'task_conflict';
  readonly httpStatus = 409;

  constructor() {
    super('task_conflict');
  }
}

/** Значение нарушило CHECK/длину в БД, хотя прошло DTO (SQLSTATE 23514 / 22001). */
export class TaskInvalidError extends DomainError {
  readonly code = 'validation_failed';
  readonly httpStatus = 422;

  constructor() {
    super('validation_failed');
  }
}
