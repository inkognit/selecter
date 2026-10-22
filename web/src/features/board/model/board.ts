import { TASK_STATUSES, type Task, type TaskStatus } from '@/api/types';

export type Columns = Record<TaskStatus, Task[]>;

/** Задачи по колонкам, внутри колонки — по position. */
export function groupByStatus(tasks: readonly Task[]): Columns {
  const columns = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as Task[]])) as Columns;
  for (const t of tasks) columns[t.status].push(t);
  for (const s of TASK_STATUSES) columns[s].sort((a, b) => a.position - b.position);
  return columns;
}

/**
 * Оптимистичный перенос — те же правила, что у бэкенда (backend/.../domain/positions.ts):
 * позиция вне диапазона приводится к началу/концу, позиции в колонках идут подряд.
 * Сервер всё равно пришлёт истину — после ответа доска перезапрашивается.
 */
export function applyMove(tasks: readonly Task[], taskId: string, status: TaskStatus, position: number): Task[] {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return [...tasks];

  const columns = groupByStatus(tasks);
  const source = columns[task.status].filter((t) => t.id !== taskId);
  const target = task.status === status ? source : columns[status].filter((t) => t.id !== taskId);
  const at = Math.min(Math.max(Math.trunc(position), 0), target.length);
  target.splice(at, 0, { ...task, status });

  columns[task.status] = source;
  columns[status] = target;
  return TASK_STATUSES.flatMap((s) =>
    columns[s].map((t, i) => (t.position === i && t.status === s ? t : { ...t, position: i })),
  );
}

/** Оптимистичное удаление: позиции оставшихся в колонке сдвигаются. */
export function applyRemove(tasks: readonly Task[], taskId: string): Task[] {
  const columns = groupByStatus(tasks.filter((t) => t.id !== taskId));
  return TASK_STATUSES.flatMap((s) => columns[s].map((t, i) => (t.position === i ? t : { ...t, position: i })));
}
