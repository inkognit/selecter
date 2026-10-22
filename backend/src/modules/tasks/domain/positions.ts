/**
 * Правила порядка задач в колонках. Чистые функции: их используют и репозиторий
 * (в транзакции), и фейк репозитория в тестах — поэтому они в domain, а не в сервисе.
 *
 * Инвариант: в каждой колонке позиции 0..n-1 без дыр и повторов, позиция = индекс в списке.
 */

/** Приводит запрошенную позицию к допустимой: [0, maxIndex]. Не ошибка, а нормализация (TZ Ф-6). */
export function clampPosition(requested: number, maxIndex: number): number {
  if (maxIndex <= 0) return 0;
  return Math.min(Math.max(Math.trunc(requested), 0), maxIndex);
}

export interface MovePlanInput {
  taskId: string;
  /** Упорядоченные id исходной колонки, включая taskId. */
  sourceIds: readonly string[];
  /** Упорядоченные id целевой колонки; null — перенос внутри той же колонки. */
  targetIds: readonly string[] | null;
  requestedPosition: number;
}

export interface MovePlan {
  /** Новый порядок исходной колонки (для переноса внутри колонки — единственный список). */
  sourceIds: string[];
  /** Новый порядок целевой колонки; null — перенос внутри колонки. */
  targetIds: string[] | null;
  /** Итоговая позиция задачи после нормализации. */
  position: number;
}

export class TaskNotInColumnError extends Error {}

export function planMove({ taskId, sourceIds, targetIds, requestedPosition }: MovePlanInput): MovePlan {
  const from = sourceIds.indexOf(taskId);
  if (from === -1) throw new TaskNotInColumnError(`задача ${taskId} не найдена в исходной колонке`);

  const rest = sourceIds.filter((id) => id !== taskId);

  if (targetIds === null) {
    const position = clampPosition(requestedPosition, rest.length);
    rest.splice(position, 0, taskId);
    return { sourceIds: rest, targetIds: null, position };
  }

  const target = targetIds.filter((id) => id !== taskId);
  const position = clampPosition(requestedPosition, target.length);
  target.splice(position, 0, taskId);
  return { sourceIds: rest, targetIds: target, position };
}

/** Порядок колонки после удаления задачи — позиции сдвигаются, дыр не остаётся. */
export function planRemoval(columnIds: readonly string[], taskId: string): string[] {
  return columnIds.filter((id) => id !== taskId);
}
