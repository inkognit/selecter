/**
 * Базовая доменная ошибка: стабильный машинный код в snake_case и HTTP-статус.
 * Человеческий текст по коду формирует фронт (humanizeApiError), бэкенд его не отдаёт.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details: unknown = null;
}
