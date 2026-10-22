import { ApiClientError } from './client';

const MESSAGES: Record<string, string> = {
  task_not_found: 'Задача не найдена — возможно, её уже удалили',
  validation_failed: 'Проверьте заполнение полей',
  task_conflict: 'Доску изменили одновременно с вами — обновили данные, повторите действие',
  internal_error: 'Ошибка на сервере. Подробности в логах',
};

export const UNAVAILABLE_MESSAGE = 'Сервер недоступен. Проверьте, что бэкенд запущен';

/**
 * Код ошибки → текст для человека. ОДНО место на всё приложение (codestyle-node §2).
 * `internal_error` («смотри логи бэкенда») и сеть/`http_NNN` («бэкенд не запущен») различаются намеренно.
 */
export function humanizeApiError(error: unknown): string {
  if (!(error instanceof ApiClientError)) return 'Что-то пошло не так. Обновите страницу';
  if (error.code === 'network_error' || error.code.startsWith('http_')) return UNAVAILABLE_MESSAGE;
  return MESSAGES[error.code] ?? `Ошибка: ${error.code}`;
}

export const isApiError = (error: unknown, code: string): boolean =>
  error instanceof ApiClientError && error.code === code;
