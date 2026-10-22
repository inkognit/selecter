import type { TaskStatus } from '../domain/task';
import { InMemoryTasksRepository } from './__tests__/in-memory-tasks.repository';
import { TaskNotFoundError } from './tasks.errors';
import { TasksService } from './tasks.service';

const MISSING = '11111111-1111-4111-8111-111111111111';

describe('TasksService', () => {
  let repo: InMemoryTasksRepository;
  let service: TasksService;

  beforeEach(() => {
    repo = new InMemoryTasksRepository();
    service = new TasksService(repo);
  });

  const titlesIn = async (status: TaskStatus): Promise<string[]> =>
    (await service.list()).filter((t) => t.status === status).map((t) => t.title);

  const positionsIn = async (status: TaskStatus): Promise<number[]> =>
    (await service.list()).filter((t) => t.status === status).map((t) => t.position);

  describe('create', () => {
    it('обрезает пробелы, пустое описание → null, приоритет по умолчанию MEDIUM', async () => {
      const t = await service.create({ title: '  Задача  ', description: '   ' });
      expect(t).toMatchObject({ title: 'Задача', description: null, priority: 'MEDIUM', status: 'NEW', position: 0 });
    });

    it('новая задача встаёт в конец колонки «Новая»', async () => {
      await service.create({ title: 'A' });
      await service.create({ title: 'B' });
      const c = await service.create({ title: 'C', priority: 'HIGH' });
      expect(c.position).toBe(2);
      expect(await titlesIn('NEW')).toEqual(['A', 'B', 'C']);
    });
  });

  describe('update', () => {
    it('меняет только переданные поля; description: null очищает', async () => {
      const t = await service.create({ title: 'A', description: 'текст', priority: 'LOW' });
      const u = await service.update(t.id, { description: null });
      expect(u).toMatchObject({ title: 'A', description: null, priority: 'LOW' });
      expect(u.updatedAt.getTime()).toBeGreaterThan(t.updatedAt.getTime());
    });

    it('несуществующая задача → task_not_found', async () => {
      await expect(service.update(MISSING, { title: 'X' })).rejects.toBeInstanceOf(TaskNotFoundError);
    });
  });

  describe('move', () => {
    it('между колонками: обе колонки остаются без дыр', async () => {
      const [a, b] = [await service.create({ title: 'A' }), await service.create({ title: 'B' })];
      await service.create({ title: 'C' });
      await service.move(a.id, 'IN_PROGRESS', 0);
      await service.move(b.id, 'IN_PROGRESS', 0);

      expect(await titlesIn('NEW')).toEqual(['C']);
      expect(await positionsIn('NEW')).toEqual([0]);
      expect(await titlesIn('IN_PROGRESS')).toEqual(['B', 'A']);
      expect(await positionsIn('IN_PROGRESS')).toEqual([0, 1]);
    });

    it('внутри колонки: перестановка вниз', async () => {
      const a = await service.create({ title: 'A' });
      await service.create({ title: 'B' });
      await service.create({ title: 'C' });
      const moved = await service.move(a.id, 'NEW', 2);
      expect(moved.position).toBe(2);
      expect(await titlesIn('NEW')).toEqual(['B', 'C', 'A']);
    });

    it('позиция вне диапазона приводится к концу', async () => {
      const a = await service.create({ title: 'A' });
      const moved = await service.move(a.id, 'DONE', 50);
      expect(moved).toMatchObject({ status: 'DONE', position: 0 });
    });

    it('несуществующая задача → task_not_found', async () => {
      await expect(service.move(MISSING, 'DONE', 0)).rejects.toBeInstanceOf(TaskNotFoundError);
    });
  });

  describe('remove', () => {
    it('позиции оставшихся сдвигаются', async () => {
      await service.create({ title: 'A' });
      const b = await service.create({ title: 'B' });
      await service.create({ title: 'C' });
      expect(await service.remove(b.id)).toEqual({ id: b.id });
      expect(await titlesIn('NEW')).toEqual(['A', 'C']);
      expect(await positionsIn('NEW')).toEqual([0, 1]);
    });

    it('повторное удаление → task_not_found', async () => {
      const a = await service.create({ title: 'A' });
      await service.remove(a.id);
      await expect(service.remove(a.id)).rejects.toBeInstanceOf(TaskNotFoundError);
    });
  });

  it('get несуществующей задачи → task_not_found', async () => {
    await expect(service.get(MISSING)).rejects.toMatchObject({ code: 'task_not_found', httpStatus: 404 });
  });
});
