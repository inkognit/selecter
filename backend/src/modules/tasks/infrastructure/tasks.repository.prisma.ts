import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import type { Prisma, Task as TaskRow } from '../../../generated/prisma/client';
import type { NewTask, TaskChanges, TasksRepository } from '../application/tasks.port';
import { planMove, planRemoval } from '../domain/positions';
import type { Task, TaskStatus } from '../domain/task';
import { mapDbError } from './db-errors';

type Tx = Prisma.TransactionClient;

/**
 * Ключ advisory-lock доски. Все записи, меняющие позиции, сериализуются на нём: доска одна,
 * записи редкие — очередь дешевле разбора гонок (docs/DB.md §3).
 */
const BOARD_LOCK_KEY = 7_340_001;

@Injectable()
export class PrismaTasksRepository implements TasksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Task[]> {
    const rows = await this.prisma.task.findMany({ orderBy: [{ status: 'asc' }, { position: 'asc' }] });
    return rows.map(toTask);
  }

  async findById(id: string): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({ where: { id } });
    return row ? toTask(row) : null;
  }

  create(data: NewTask): Promise<Task> {
    return this._write(async (tx) => {
      const { _max } = await tx.task.aggregate({ where: { status: 'NEW' }, _max: { position: true } });
      const row = await tx.task.create({ data: { ...data, status: 'NEW', position: (_max.position ?? -1) + 1 } });
      return toTask(row);
    });
  }

  async update(id: string, changes: TaskChanges): Promise<Task | null> {
    try {
      const { count } = await this.prisma.task.updateMany({ where: { id }, data: changes });
      return count === 0 ? null : this.findById(id);
    } catch (e) {
      throw mapDbError(e);
    }
  }

  move(id: string, status: TaskStatus, position: number): Promise<Task | null> {
    return this._write(async (tx) => {
      const task = await tx.task.findUnique({ where: { id } });
      if (!task) return null;

      const sameColumn = task.status === status;
      const plan = planMove({
        taskId: id,
        sourceIds: await columnIds(tx, task.status),
        targetIds: sameColumn ? null : await columnIds(tx, status),
        requestedPosition: position,
      });
      if (sameColumn && plan.position === task.position) return toTask(task);

      await reindex(tx, plan.sourceIds, id);
      if (plan.targetIds) await reindex(tx, plan.targetIds, id);
      const row = await tx.task.update({ where: { id }, data: { status, position: plan.position } });
      return toTask(row);
    });
  }

  remove(id: string): Promise<boolean> {
    return this._write(async (tx) => {
      const task = await tx.task.findUnique({ where: { id }, select: { status: true } });
      if (!task) return false;
      const rest = planRemoval(await columnIds(tx, task.status), id);
      await tx.task.delete({ where: { id } });
      await reindex(tx, rest);
      return true;
    });
  }

  /** Транзакция под блокировкой доски + перевод ошибок БД в доменные. */
  private async _write<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(${BOARD_LOCK_KEY}::bigint)`;
        return fn(tx);
      });
    } catch (e) {
      throw mapDbError(e);
    }
  }
}

async function columnIds(tx: Tx, status: TaskStatus): Promise<string[]> {
  const rows = await tx.task.findMany({ where: { status }, orderBy: { position: 'asc' }, select: { id: true } });
  return rows.map((r) => r.id);
}

/**
 * Позиция = индекс в списке. Одним UPDATE и в обход @updatedAt: сдвиг соседей — не их
 * изменение, дата «Изменена» у них прыгать не должна. Отложенный UNIQUE проверит итог на COMMIT.
 */
async function reindex(tx: Tx, orderedIds: string[], exceptId?: string): Promise<void> {
  const ids: string[] = [];
  const positions: number[] = [];
  orderedIds.forEach((taskId, index) => {
    if (taskId === exceptId) return;
    ids.push(taskId);
    positions.push(index);
  });
  if (ids.length === 0) return;
  await tx.$executeRaw`
    UPDATE tasks AS t SET position = v.position
    FROM unnest(${ids}::uuid[], ${positions}::int[]) AS v(id, position)
    WHERE t.id = v.id AND t.position <> v.position`;
}

function toTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    position: row.position,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
