import type { TaskStatus } from '@/api/types';

export type ColumnIds = Record<TaskStatus, string[]>;

/**
 * Куда упала карточка. `ids` — порядок на момент отпускания: при переходе между колонками
 * карточка уже вставлена в новую колонку (onDragOver). Если отпустили над другой карточкой
 * той же колонки — карточка занимает её индекс (семантика arrayMove в dnd-kit).
 * Итоговый индекс = позиция для PATCH /tasks/:id/move.
 */
export function resolveDrop(
  ids: ColumnIds,
  activeId: string,
  overId: string,
  containerOf: (id: string, ids: ColumnIds) => TaskStatus | null,
): { status: TaskStatus; position: number } | null {
  const status = containerOf(activeId, ids);
  if (!status) return null;
  const list = ids[status];
  const from = list.indexOf(activeId);
  const overInSame = overId !== activeId && containerOf(overId, ids) === status && list.includes(overId);
  return { status, position: overInSame ? list.indexOf(overId) : from };
}
