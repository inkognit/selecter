import { describe, expect, it } from 'vitest';
import { isDirty, toTaskInput, validateTaskForm, EMPTY_FORM } from './task-form';

describe('validateTaskForm — те же правила, что у бэкенда', () => {
  it.each([
    ['', 'Введите название'],
    ['   ', 'Введите название'],
    ['a'.repeat(201), 'Не длиннее 200 символов'],
  ])('название %j → ошибка', (title, message) => {
    expect(validateTaskForm({ ...EMPTY_FORM, title }).title).toBe(message);
  });

  it('200 символов после обрезки пробелов — можно', () => {
    expect(validateTaskForm({ ...EMPTY_FORM, title: `  ${'a'.repeat(200)}  ` }).title).toBeUndefined();
  });

  it('описание длиннее 5000 — ошибка', () => {
    expect(validateTaskForm({ ...EMPTY_FORM, title: 'x', description: 'a'.repeat(5001) }).description).toBeDefined();
  });
});

describe('toTaskInput', () => {
  it('обрезает пробелы, пустое описание → null', () => {
    expect(toTaskInput({ title: '  Задача ', description: '  \n ', priority: 'HIGH' })).toEqual({
      title: 'Задача',
      description: null,
      priority: 'HIGH',
    });
  });
});

describe('isDirty', () => {
  it('замечает любое изменение поля', () => {
    expect(isDirty(EMPTY_FORM, EMPTY_FORM)).toBe(false);
    expect(isDirty(EMPTY_FORM, { ...EMPTY_FORM, priority: 'LOW' })).toBe(true);
  });
});
