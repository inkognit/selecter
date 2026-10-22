import { describe, expect, it } from 'vitest';
import type { Task, TaskStatus } from '@/api/types';
import { applyMove, applyRemove, groupByStatus } from './board';
import { resolveDrop, type ColumnIds } from './dnd';

const task = (id: string, status: TaskStatus, position: number): Task => ({
  id,
  title: id.toUpperCase(),
  description: null,
  status,
  priority: 'MEDIUM',
  position,
  createdAt: '2026-10-22T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
});

const view = (tasks: Task[]) => {
  const c = groupByStatus(tasks);
  return {
    NEW: c.NEW.map((t) => `${t.position}:${t.id}`),
    IN_PROGRESS: c.IN_PROGRESS.map((t) => `${t.position}:${t.id}`),
    DONE: c.DONE.map((t) => `${t.position}:${t.id}`),
  };
};

const board = [task('a', 'NEW', 0), task('b', 'NEW', 1), task('c', 'NEW', 2), task('x', 'DONE', 0)];

describe('groupByStatus', () => {
  it('раскладывает по колонкам и сортирует по позиции', () => {
    const shuffled = [task('b', 'NEW', 1), task('x', 'DONE', 0), task('a', 'NEW', 0)];
    expect(view(shuffled)).toEqual({ NEW: ['0:a', '1:b'], IN_PROGRESS: [], DONE: ['0:x'] });
  });
});

describe('applyMove — оптимистичный перенос по правилам бэкенда', () => {
  it('между колонками: обе без дыр', () => {
    expect(view(applyMove(board, 'b', 'DONE', 0))).toEqual({
      NEW: ['0:a', '1:c'],
      IN_PROGRESS: [],
      DONE: ['0:b', '1:x'],
    });
  });

  it('внутри колонки вниз', () => {
    expect(view(applyMove(board, 'a', 'NEW', 2)).NEW).toEqual(['0:b', '1:c', '2:a']);
  });

  it('позиция вне диапазона — в конец (меню «Переместить в…» шлёт MAX_SAFE_INTEGER)', () => {
    expect(view(applyMove(board, 'a', 'DONE', Number.MAX_SAFE_INTEGER)).DONE).toEqual(['0:x', '1:a']);
  });

  it('в пустую колонку', () => {
    expect(view(applyMove(board, 'c', 'IN_PROGRESS', 5)).IN_PROGRESS).toEqual(['0:c']);
  });

  it('неизвестный id — доска без изменений, исходный массив не мутируется', () => {
    const before = JSON.stringify(board);
    expect(view(applyMove(board, 'zzz', 'DONE', 0))).toEqual(view(board));
    applyMove(board, 'a', 'DONE', 0);
    expect(JSON.stringify(board)).toBe(before);
  });
});

describe('applyRemove', () => {
  it('позиции оставшихся сдвигаются', () => {
    expect(view(applyRemove(board, 'a')).NEW).toEqual(['0:b', '1:c']);
  });
});

describe('resolveDrop — куда упала карточка', () => {
  const containerOf = (id: string, ids: ColumnIds): TaskStatus | null =>
    (['NEW', 'IN_PROGRESS', 'DONE'] as TaskStatus[]).find((s) => s === id || ids[s].includes(id)) ?? null;
  const ids: ColumnIds = { NEW: ['a', 'b', 'c'], IN_PROGRESS: [], DONE: ['x'] };

  it('над другой карточкой своей колонки — занимает её индекс', () => {
    expect(resolveDrop(ids, 'a', 'c', containerOf)).toEqual({ status: 'NEW', position: 2 });
    expect(resolveDrop(ids, 'c', 'a', containerOf)).toEqual({ status: 'NEW', position: 0 });
  });

  it('над самой колонкой — остаётся, где вставил onDragOver', () => {
    const afterOver: ColumnIds = { NEW: ['a', 'c'], IN_PROGRESS: ['b'], DONE: ['x'] };
    expect(resolveDrop(afterOver, 'b', 'IN_PROGRESS', containerOf)).toEqual({ status: 'IN_PROGRESS', position: 0 });
  });

  it('над собой — позиция не меняется', () => {
    expect(resolveDrop(ids, 'b', 'b', containerOf)).toEqual({ status: 'NEW', position: 1 });
  });
});
