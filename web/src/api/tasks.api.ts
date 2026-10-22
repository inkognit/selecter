import { apiRequest } from './client';
import type { Task, TaskInput, TaskStatus } from './types';

const json = (body: unknown): string => JSON.stringify(body);

export const tasksApi = {
  list: () => apiRequest<Task[]>('/tasks'),
  create: (input: TaskInput) => apiRequest<Task>('/tasks', { method: 'POST', body: json(input) }),
  update: (id: string, input: TaskInput) => apiRequest<Task>(`/tasks/${id}`, { method: 'PATCH', body: json(input) }),
  move: (id: string, status: TaskStatus, position: number) =>
    apiRequest<Task>(`/tasks/${id}/move`, { method: 'PATCH', body: json({ status, position }) }),
  remove: (id: string) => apiRequest<{ id: string }>(`/tasks/${id}`, { method: 'DELETE' }),
};
