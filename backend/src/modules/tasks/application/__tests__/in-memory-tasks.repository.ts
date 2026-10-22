import { planMove, planRemoval } from '../../domain/positions';
import { TASK_STATUSES, type Task, type TaskStatus } from '../../domain/task';
import type { NewTask, TaskChanges, TasksRepository } from '../tasks.port';

/**
 * Фейк порта в памяти (codestyle-node §8: фейки, а не моки ORM). Те же правила позиций
 * из domain, что и у Prisma-репозитория, поэтому тест проверяет поведение, а не вызовы.
 */
export class InMemoryTasksRepository implements TasksRepository {
  private readonly rows = new Map<string, Task>();
  private seq = 0;
  private clock = Date.UTC(2026, 9, 22);

  async findAll(): Promise<Task[]> {
    return TASK_STATUSES.flatMap((s) => this.column(s)).map((t) => ({ ...t }));
  }

  async findById(id: string): Promise<Task | null> {
    const t = this.rows.get(id);
    return t ? { ...t } : null;
  }

  async create(data: NewTask): Promise<Task> {
    const now = this.tick();
    const task: Task = {
      id: `00000000-0000-4000-8000-${String(++this.seq).padStart(12, '0')}`,
      ...data,
      status: 'NEW',
      position: this.column('NEW').length,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(task.id, task);
    return { ...task };
  }

  async update(id: string, changes: TaskChanges): Promise<Task | null> {
    const t = this.rows.get(id);
    if (!t) return null;
    Object.assign(t, changes, { updatedAt: this.tick() });
    return { ...t };
  }

  async move(id: string, status: TaskStatus, position: number): Promise<Task | null> {
    const t = this.rows.get(id);
    if (!t) return null;
    const ids = (s: TaskStatus): string[] => this.column(s).map((x) => x.id);
    const plan = planMove({
      taskId: id,
      sourceIds: ids(t.status),
      targetIds: t.status === status ? null : ids(status),
      requestedPosition: position,
    });
    this.apply(plan.sourceIds, t.status);
    if (plan.targetIds) this.apply(plan.targetIds, status);
    t.updatedAt = this.tick();
    return { ...t };
  }

  async remove(id: string): Promise<boolean> {
    const t = this.rows.get(id);
    if (!t) return false;
    const rest = planRemoval(
      this.column(t.status).map((x) => x.id),
      id,
    );
    this.rows.delete(id);
    this.apply(rest, t.status);
    return true;
  }

  private column(status: TaskStatus): Task[] {
    return [...this.rows.values()].filter((t) => t.status === status).sort((a, b) => a.position - b.position);
  }

  private apply(orderedIds: string[], status: TaskStatus): void {
    orderedIds.forEach((id, position) => Object.assign(this.rows.get(id)!, { status, position }));
  }

  private tick(): Date {
    this.clock += 1000;
    return new Date(this.clock);
  }
}
