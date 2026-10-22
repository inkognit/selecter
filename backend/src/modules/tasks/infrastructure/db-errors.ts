import { TaskConflictError, TaskInvalidError } from '../application/tasks.errors';

/**
 * SQLSTATE из ошибки Prisma 7 + adapter-pg. Код лежит в разных местах в зависимости от того,
 * где упало: в запросе или на COMMIT отложенного ограничения. Ищем по всей цепочке
 * (cause / meta / driverAdapterError), а не в одном поле.
 */
export function sqlStateOf(error: unknown): string | null {
  const seen = new Set<unknown>();
  const queue: unknown[] = [error];
  while (queue.length) {
    const e = queue.shift();
    if (!e || typeof e !== 'object' || seen.has(e)) continue;
    seen.add(e);
    const o = e as Record<string, unknown>;
    for (const key of ['originalCode', 'code']) {
      const v = o[key];
      if (typeof v === 'string' && /^\d{2}[0-9A-Z]{3}$/.test(v)) return v;
    }
    if (o.code === 'P2002') return '23505';
    const meta = o.meta as Record<string, unknown> | undefined;
    queue.push(o.cause, meta, meta?.driverAdapterError);
  }
  return null;
}

/** Нарушение инварианта БД → доменная ошибка (правило gonets №3); остальное пробрасываем как есть. */
export function mapDbError(error: unknown): unknown {
  switch (sqlStateOf(error)) {
    case '23505':
      return new TaskConflictError();
    case '23514':
    case '22001':
      return new TaskInvalidError();
    default:
      return error;
  }
}
