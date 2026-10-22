import { Inject, Injectable } from '@nestjs/common';
import { normalizeDescription, Task, TaskPriority, TaskStatus } from '../domain/task';
import { TaskNotFoundError } from './tasks.errors';
import { TASKS_REPOSITORY, TaskChanges, TasksRepository } from './tasks.port';

export interface CreateTaskCommand {
  title: string;
  description?: string | null;
  priority?: TaskPriority;
}

export interface UpdateTaskCommand {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
}

@Injectable()
export class TasksService {
  constructor(@Inject(TASKS_REPOSITORY) private readonly tasks: TasksRepository) {}

  list(): Promise<Task[]> {
    return this.tasks.findAll();
  }

  async get(id: string): Promise<Task> {
    return this.found(id, await this.tasks.findById(id));
  }

  create(cmd: CreateTaskCommand): Promise<Task> {
    return this.tasks.create({
      title: cmd.title.trim(),
      description: normalizeDescription(cmd.description) ?? null,
      priority: cmd.priority ?? 'MEDIUM',
    });
  }

  async update(id: string, cmd: UpdateTaskCommand): Promise<Task> {
    const changes: TaskChanges = {};
    if (cmd.title !== undefined) changes.title = cmd.title.trim();
    if (cmd.description !== undefined) changes.description = normalizeDescription(cmd.description);
    if (cmd.priority !== undefined) changes.priority = cmd.priority;
    return this.found(id, await this.tasks.update(id, changes));
  }

  async move(id: string, status: TaskStatus, position: number): Promise<Task> {
    return this.found(id, await this.tasks.move(id, status, position));
  }

  async remove(id: string): Promise<{ id: string }> {
    if (!(await this.tasks.remove(id))) throw new TaskNotFoundError(id);
    return { id };
  }

  private found(id: string, task: Task | null): Task {
    if (!task) throw new TaskNotFoundError(id);
    return task;
  }
}
