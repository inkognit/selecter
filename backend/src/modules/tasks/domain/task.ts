/**
 * Доменная модель задачи. Не зависит ни от Prisma, ни от Nest: значения enum совпадают
 * с enum БД (task_status / task_priority), сверку держит репозиторий.
 */
export const TASK_STATUSES = ['NEW', 'IN_PROGRESS', 'DONE'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const TITLE_MAX_LENGTH = 200;
export const DESCRIPTION_MAX_LENGTH = 5000;

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Пустое или из пробелов описание хранится как null (TZ §3). */
export function normalizeDescription(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) return value;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}
