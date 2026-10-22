import { DESCRIPTION_MAX_LENGTH, TITLE_MAX_LENGTH, type Task, type TaskInput, type TaskPriority } from '@/api/types';

/** Значения формы: строки как ввёл пользователь, без обрезки. */
export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
}

export const EMPTY_FORM: TaskFormValues = { title: '', description: '', priority: 'MEDIUM' };

export const formFromTask = (t: Task): TaskFormValues => ({
  title: t.title,
  description: t.description ?? '',
  priority: t.priority,
});

/** Те же правила, что у бэкенда (docs/TZ.md §3): длина названия — после обрезки пробелов. */
export function validateTaskForm(v: TaskFormValues): { title?: string; description?: string } {
  const title = v.title.trim();
  return {
    title: !title
      ? 'Введите название'
      : title.length > TITLE_MAX_LENGTH
        ? `Не длиннее ${TITLE_MAX_LENGTH} символов`
        : undefined,
    description:
      v.description.length > DESCRIPTION_MAX_LENGTH ? `Не длиннее ${DESCRIPTION_MAX_LENGTH} символов` : undefined,
  };
}

export function toTaskInput(v: TaskFormValues): TaskInput {
  const description = v.description.trim();
  return { title: v.title.trim(), description: description || null, priority: v.priority };
}

export const isDirty = (a: TaskFormValues, b: TaskFormValues): boolean =>
  a.title !== b.title || a.description !== b.description || a.priority !== b.priority;
