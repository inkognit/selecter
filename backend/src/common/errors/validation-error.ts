import { ValidationError } from 'class-validator';
import { DomainError } from './domain-error';

export interface FieldViolation {
  field: string;
  constraints: string[];
}

/** Неверный вход: тело, лишнее поле, неизвестный enum. details — какие поля и какие правила. */
export class RequestValidationError extends DomainError {
  readonly code = 'validation_failed';
  readonly httpStatus = 422;
  override readonly details: FieldViolation[];

  constructor(violations: FieldViolation[]) {
    super('validation_failed');
    this.details = violations;
  }
}

/** Плоский список нарушений class-validator (вложенные поля — через точку). */
export function flattenValidationErrors(errors: ValidationError[], parent = ''): FieldViolation[] {
  return errors.flatMap((e) => {
    const field = parent ? `${parent}.${e.property}` : e.property;
    const own = e.constraints ? [{ field, constraints: Object.keys(e.constraints) }] : [];
    return [...own, ...flattenValidationErrors(e.children ?? [], field)];
  });
}
