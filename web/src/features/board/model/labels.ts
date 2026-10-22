import type { TaskPriority, TaskStatus } from '@/api/types';

export const STATUS_LABELS: Record<TaskStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Готово',
};

/** Цвет полосы над колонкой (docs/DESIGN.md §2). */
export const STATUS_COLORS: Record<TaskStatus, 'info' | 'warning' | 'success'> = {
  NEW: 'info',
  IN_PROGRESS: 'warning',
  DONE: 'success',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
};

export const PRIORITY_COLORS: Record<TaskPriority, 'default' | 'warning' | 'error'> = {
  LOW: 'default',
  MEDIUM: 'warning',
  HIGH: 'error',
};

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export const formatDate = (iso: string): string => dateFormat.format(new Date(iso));
