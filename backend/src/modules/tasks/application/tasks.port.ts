import type { Task, TaskPriority, TaskStatus } from '../domain/task';

export const TASKS_REPOSITORY = Symbol('TASKS_REPOSITORY');

export interface NewTask {
  title: string;
  description: string | null;
  priority: TaskPriority;
}

export interface TaskChanges {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
}

/**
 * Порт хранилища задач. Методы, меняющие позиции (create, move, remove), атомарны:
 * после них в каждой колонке позиции 0..n-1 без дыр. null — задачи с таким id нет.
 */
export interface TasksRepository {
  findAll(): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  /** Создаёт задачу в конце колонки NEW. */
  create(data: NewTask): Promise<Task>;
  update(id: string, changes: TaskChanges): Promise<Task | null>;
  move(id: string, status: TaskStatus, position: number): Promise<Task | null>;
  remove(id: string): Promise<boolean>;
}
