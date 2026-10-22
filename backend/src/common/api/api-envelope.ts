/** Единый конверт ответа API (codestyle-node §2). */
export interface ApiError {
  code: string;
  details: unknown;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: unknown;
  error: ApiError | null;
}

export const ok = <T>(data: T): ApiEnvelope<T> => ({ success: true, data, meta: null, error: null });

export const fail = (code: string, details: unknown = null): ApiEnvelope<never> => ({
  success: false,
  data: null,
  meta: null,
  error: { code, details },
});
