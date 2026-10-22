import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { setupApp } from '../src/app.setup';
import { PrismaService } from '../src/core/prisma/prisma.service';
import { mapDbError } from '../src/modules/tasks/infrastructure/db-errors';
import { TaskConflictError, TaskInvalidError } from '../src/modules/tasks/application/tasks.errors';

interface TaskJson {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

const MISSING = '11111111-1111-4111-8111-111111111111';

describe('Tasks API (e2e, живой PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let http: ReturnType<typeof request>;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    // Слушаем реальный порт: иначе supertest поднимает сервер заново на каждый запрос.
    await app.listen(0, '127.0.0.1');
    prisma = app.get(PrismaService);
    http = request(await app.getUrl());
  });

  beforeEach(async () => {
    await prisma.$executeRawUnsafe('TRUNCATE tasks');
  });

  afterAll(async () => {
    await app.close();
  });

  const create = async (title: string, extra: object = {}): Promise<TaskJson> =>
    (
      await http
        .post('/api/v1/tasks')
        .send({ title, ...extra })
        .expect(201)
    ).body.data;

  const board = async (): Promise<Record<string, string[]>> => {
    const tasks: TaskJson[] = (await http.get('/api/v1/tasks').expect(200)).body.data;
    const byStatus: Record<string, string[]> = { NEW: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) byStatus[t.status].push(`${t.position}:${t.title}`);
    return byStatus;
  };

  it('health и конверт ответа', async () => {
    const res = await http.get('/api/v1/health').expect(200);
    expect(res.body).toEqual({ success: true, data: { status: 'ok' }, meta: null, error: null });
  });

  it('полный цикл: создать → прочитать → изменить → удалить', async () => {
    const t = await create('  Задача  ', { description: 'описание', priority: 'HIGH' });
    expect(t).toMatchObject({ title: 'Задача', description: 'описание', priority: 'HIGH', status: 'NEW', position: 0 });
    expect(Object.keys(t).sort()).toEqual(
      ['createdAt', 'description', 'id', 'position', 'priority', 'status', 'title', 'updatedAt'].sort(),
    );

    expect((await http.get(`/api/v1/tasks/${t.id}`).expect(200)).body.data).toEqual(t);

    const u = (await http.patch(`/api/v1/tasks/${t.id}`).send({ title: 'Новое', description: null }).expect(200)).body
      .data;
    expect(u).toMatchObject({ title: 'Новое', description: null, priority: 'HIGH' });
    expect(new Date(u.updatedAt).getTime()).toBeGreaterThanOrEqual(new Date(t.updatedAt).getTime());

    expect((await http.delete(`/api/v1/tasks/${t.id}`).expect(200)).body.data).toEqual({ id: t.id });
    const gone = await http.get(`/api/v1/tasks/${t.id}`).expect(404);
    expect(gone.body.error.code).toBe('task_not_found');
  });

  it('перенос между колонками и внутри колонки — позиции без дыр', async () => {
    const a = await create('A');
    const b = await create('B');
    await create('C');

    await http.patch(`/api/v1/tasks/${b.id}/move`).send({ status: 'IN_PROGRESS', position: 0 }).expect(200);
    await http.patch(`/api/v1/tasks/${a.id}/move`).send({ status: 'IN_PROGRESS', position: 99 }).expect(200);
    expect(await board()).toEqual({ NEW: ['0:C'], IN_PROGRESS: ['0:B', '1:A'], DONE: [] });

    await http.patch(`/api/v1/tasks/${a.id}/move`).send({ status: 'IN_PROGRESS', position: 0 }).expect(200);
    expect((await board()).IN_PROGRESS).toEqual(['0:A', '1:B']);
  });

  it('сдвиг соседей не меняет их updatedAt', async () => {
    const a = await create('A');
    const b = await create('B');
    await http.patch(`/api/v1/tasks/${a.id}/move`).send({ status: 'DONE', position: 0 }).expect(200);
    const bAfter: TaskJson = (await http.get(`/api/v1/tasks/${b.id}`).expect(200)).body.data;
    expect(bAfter.position).toBe(0);
    expect(bAfter.updatedAt).toBe(b.updatedAt);
  });

  it('удаление сдвигает позиции оставшихся', async () => {
    await create('A');
    const b = await create('B');
    await create('C');
    await http.delete(`/api/v1/tasks/${b.id}`).expect(200);
    expect((await board()).NEW).toEqual(['0:A', '1:C']);
  });

  it('параллельные переносы и создания не ломают инвариант (блокировка доски)', async () => {
    const tasks = await Promise.all(Array.from({ length: 8 }, (_, i) => create(`T${i}`)));
    await Promise.all([
      ...tasks.map((t, i) =>
        http
          .patch(`/api/v1/tasks/${t.id}/move`)
          .send({ status: i % 2 ? 'DONE' : 'IN_PROGRESS', position: 0 })
          .expect(200),
      ),
      create('X'),
      create('Y'),
    ]);
    const b = await board();
    for (const column of Object.values(b)) {
      expect(column.map((c) => Number(c.split(':')[0]))).toEqual(column.map((_, i) => i));
    }
    expect(b.NEW.length + b.IN_PROGRESS.length + b.DONE.length).toBe(10);
  });

  describe('негатив', () => {
    it.each([
      ['пустое название', { title: '   ' }],
      ['название 201 символ', { title: 'a'.repeat(201) }],
      ['описание 5001 символ', { title: 'x', description: 'a'.repeat(5001) }],
      ['неизвестный приоритет', { title: 'x', priority: 'URGENT' }],
      ['лишнее поле', { title: 'x', status: 'DONE' }],
      ['нет тела', {}],
    ])('POST: %s → 422 validation_failed', async (_name, body) => {
      const res = await http.post('/api/v1/tasks').send(body).expect(422);
      expect(res.body).toMatchObject({ success: false, data: null, error: { code: 'validation_failed' } });
    });

    it('PATCH title: null → 422', async () => {
      const t = await create('A');
      await http.patch(`/api/v1/tasks/${t.id}`).send({ title: null }).expect(422);
    });

    it('move: неизвестный статус и дробная позиция → 422', async () => {
      const t = await create('A');
      await http.patch(`/api/v1/tasks/${t.id}/move`).send({ status: 'ARCHIVED', position: 0 }).expect(422);
      await http.patch(`/api/v1/tasks/${t.id}/move`).send({ status: 'DONE', position: 1.5 }).expect(422);
    });

    it.each([
      ['get', (id: string) => http.get(`/api/v1/tasks/${id}`)],
      ['patch', (id: string) => http.patch(`/api/v1/tasks/${id}`).send({ title: 'x' })],
      ['move', (id: string) => http.patch(`/api/v1/tasks/${id}/move`).send({ status: 'DONE', position: 0 })],
      ['delete', (id: string) => http.delete(`/api/v1/tasks/${id}`)],
    ])('%s несуществующей и не-UUID задачи → 404 task_not_found', async (_name, call) => {
      for (const id of [MISSING, 'not-a-uuid']) {
        const res = await call(id).expect(404);
        expect(res.body.error.code).toBe('task_not_found');
      }
    });

    it('битый JSON → 422, а не 500', async () => {
      await http.post('/api/v1/tasks').set('content-type', 'application/json').send('{"title":').expect(422);
    });
  });

  describe('ограничения БД — последний рубеж (SQLSTATE → доменная ошибка)', () => {
    it('дубль позиции ловится на COMMIT и становится task_conflict', async () => {
      await create('A');
      const err = await prisma
        .$transaction(async (tx) => {
          await tx.task.create({ data: { title: 'dup', status: 'NEW', position: 0 } });
        })
        .catch((e: unknown) => e);
      expect(mapDbError(err)).toBeInstanceOf(TaskConflictError);
    });

    it('CHECK на название из пробелов → validation_failed', async () => {
      const err = await prisma.task.create({ data: { title: '   ', position: 0 } }).catch((e: unknown) => e);
      expect(mapDbError(err)).toBeInstanceOf(TaskInvalidError);
    });
  });
});
