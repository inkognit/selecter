import { clampPosition, planMove, planRemoval, TaskNotInColumnError } from './positions';

describe('clampPosition', () => {
  it.each([
    [-5, 3, 0],
    [0, 3, 0],
    [2, 3, 2],
    [3, 3, 3],
    [99, 3, 3],
    [1.7, 3, 1],
    [5, 0, 0],
  ])('clamp(%p, max=%p) = %p', (requested, max, expected) => {
    expect(clampPosition(requested, max)).toBe(expected);
  });
});

describe('planMove — внутри колонки', () => {
  const column = ['a', 'b', 'c', 'd'];

  it('вниз: a на позицию 2', () => {
    expect(planMove({ taskId: 'a', sourceIds: column, targetIds: null, requestedPosition: 2 })).toEqual({
      sourceIds: ['b', 'c', 'a', 'd'],
      targetIds: null,
      position: 2,
    });
  });

  it('вверх: d на позицию 0', () => {
    expect(planMove({ taskId: 'd', sourceIds: column, targetIds: null, requestedPosition: 0 }).sourceIds).toEqual([
      'd',
      'a',
      'b',
      'c',
    ]);
  });

  it('позиция за концом приводится к последней', () => {
    const plan = planMove({ taskId: 'b', sourceIds: column, targetIds: null, requestedPosition: 100 });
    expect(plan).toEqual({ sourceIds: ['a', 'c', 'd', 'b'], targetIds: null, position: 3 });
  });

  it('исходный список не мутируется', () => {
    const source = [...column];
    planMove({ taskId: 'a', sourceIds: source, targetIds: null, requestedPosition: 3 });
    expect(source).toEqual(column);
  });
});

describe('planMove — между колонками', () => {
  it('вставка в середину целевой колонки, исходная схлопывается', () => {
    expect(planMove({ taskId: 'b', sourceIds: ['a', 'b', 'c'], targetIds: ['x', 'y'], requestedPosition: 1 })).toEqual({
      sourceIds: ['a', 'c'],
      targetIds: ['x', 'b', 'y'],
      position: 1,
    });
  });

  it('в пустую колонку — позиция 0 при любом запросе', () => {
    expect(planMove({ taskId: 'a', sourceIds: ['a'], targetIds: [], requestedPosition: 7 })).toEqual({
      sourceIds: [],
      targetIds: ['a'],
      position: 0,
    });
  });

  it('в конец: позиция = длина целевой колонки', () => {
    const plan = planMove({ taskId: 'a', sourceIds: ['a'], targetIds: ['x', 'y'], requestedPosition: 999 });
    expect(plan.targetIds).toEqual(['x', 'y', 'a']);
    expect(plan.position).toBe(2);
  });

  it('отрицательная позиция — в начало', () => {
    expect(planMove({ taskId: 'a', sourceIds: ['a'], targetIds: ['x'], requestedPosition: -1 }).targetIds).toEqual([
      'a',
      'x',
    ]);
  });
});

describe('planMove — ошибки', () => {
  it('задачи нет в исходной колонке', () => {
    expect(() => planMove({ taskId: 'z', sourceIds: ['a'], targetIds: null, requestedPosition: 0 })).toThrow(
      TaskNotInColumnError,
    );
  });
});

describe('planRemoval', () => {
  it('позиции оставшихся идут подряд', () => {
    expect(planRemoval(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });
});
