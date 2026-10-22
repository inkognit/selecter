import type { ApiEnvelope } from './types';

export const API_BASE = '/api/v1';

/**
 * Ошибка запроса с машинным кодом. Коды:
 * - из конверта бэкенда (`task_not_found`, `validation_failed`, `internal_error`…);
 * - `network_error` — запрос не дошёл (нет сети, бэкенд не запущен);
 * - `http_NNN` — ответ не в формате конверта (прокси Next не достучался до API, старый бэкенд).
 */
export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    readonly details: unknown = null,
  ) {
    super(code);
    this.name = 'ApiClientError';
  }
}

/** Единственное место, где экран соприкасается с HTTP: запрос + распаковка конверта. */
export async function apiRequest<T>(path: string, init: RequestInit = {}, fetchImpl: typeof fetch = fetch): Promise<T> {
  let res: Response;
  try {
    res = await fetchImpl(`${API_BASE}${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', ...init.headers },
    });
  } catch {
    throw new ApiClientError('network_error', 0);
  }

  let body: ApiEnvelope<T> | null = null;
  try {
    body = (await res.json()) as ApiEnvelope<T>;
  } catch {
    body = null;
  }

  if (!body || typeof body.success !== 'boolean') throw new ApiClientError(`http_${res.status}`, res.status);
  if (!body.success) {
    throw new ApiClientError(body.error?.code ?? `http_${res.status}`, res.status, body.error?.details ?? null);
  }
  return body.data as T;
}
