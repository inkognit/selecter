import { describe, expect, it } from 'vitest';
import { ApiClientError, apiRequest } from './client';
import { humanizeApiError, UNAVAILABLE_MESSAGE } from './errors';

const respond = (status: number, body: unknown) =>
  (async () =>
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })) as unknown as typeof fetch;

const failing = (async () => {
  throw new TypeError('Failed to fetch');
}) as unknown as typeof fetch;

const codeOf = async (p: Promise<unknown>) => ((await p.catch((e: unknown) => e)) as ApiClientError).code;

describe('apiRequest — распаковка конверта', () => {
  it('success → data', async () => {
    const data = await apiRequest('/x', {}, respond(200, { success: true, data: [1], meta: null, error: null }));
    expect(data).toEqual([1]);
  });

  it('ошибка в конверте → её код и детали', async () => {
    const err = await apiRequest(
      '/x',
      {},
      respond(422, { success: false, data: null, meta: null, error: { code: 'validation_failed', details: [1] } }),
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiClientError);
    expect(err).toMatchObject({ code: 'validation_failed', status: 422, details: [1] });
  });

  it('ответ не в формате конверта (прокси не достучался) → http_NNN', async () => {
    expect(await codeOf(apiRequest('/x', {}, respond(500, '<html>Internal Server Error</html>')))).toBe('http_500');
  });

  it('запрос не дошёл → network_error', async () => {
    expect(await codeOf(apiRequest('/x', {}, failing))).toBe('network_error');
  });
});

describe('humanizeApiError — сервер недоступен ≠ ошибка на сервере', () => {
  it.each([
    [new ApiClientError('network_error', 0), UNAVAILABLE_MESSAGE],
    [new ApiClientError('http_500', 500), UNAVAILABLE_MESSAGE],
    [new ApiClientError('internal_error', 500), 'Ошибка на сервере. Подробности в логах'],
    [new ApiClientError('task_not_found', 404), 'Задача не найдена — возможно, её уже удалили'],
  ])('%s', (error, text) => {
    expect(humanizeApiError(error)).toBe(text);
  });

  it('неизвестный код не теряется — показывается как есть', () => {
    expect(humanizeApiError(new ApiClientError('brand_new_code', 400))).toContain('brand_new_code');
  });
});
