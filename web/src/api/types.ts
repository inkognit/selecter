/** Контракт API — зеркало backend/src/modules/tasks/presentation/*.dto.ts (docs/TZ.md §5). */
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
  createdAt: string;
  updatedAt: string;
}

export interface TaskInput {
  title: string;
  description: string | null;
  priority: TaskPriority;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T | null;
  meta: unknown;
  error: { code: string; details: unknown } | null;
}
