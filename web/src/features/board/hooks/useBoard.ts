'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { humanizeApiError, isApiError } from '@/api/errors';
import { tasksApi } from '@/api/tasks.api';
import type { Task, TaskInput, TaskStatus } from '@/api/types';
import { useNotify } from '@/shared/notify';
import { applyMove, applyRemove } from '../model/board';
import { STATUS_LABELS } from '../model/labels';

export const TASKS_KEY = ['tasks'] as const;

export function useTasks() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: tasksApi.list });
}

/**
 * Все изменения доски. Каждое действие сообщает результат через Snackbar и возвращает
 * true/false — форма решает, закрываться ли. Ошибки не всплывают наружу необработанными.
 */
export function useBoardActions() {
  const qc = useQueryClient();
  const notify = useNotify();

  const setTasks = useCallback(
    (fn: (tasks: Task[]) => Task[]) => qc.setQueryData<Task[]>(TASKS_KEY, (old) => (old ? fn(old) : old)),
    [qc],
  );

  const fail = useCallback(
    (error: unknown) => {
      notify(humanizeApiError(error), 'error');
      // Задачи нет или доску меняли параллельно — показанное устарело, берём истину с сервера.
      if (isApiError(error, 'task_not_found') || isApiError(error, 'task_conflict')) {
        void qc.invalidateQueries({ queryKey: TASKS_KEY });
      }
    },
    [notify, qc],
  );

  const createMutation = useMutation({ mutationFn: tasksApi.create });
  const updateMutation = useMutation({
    mutationFn: (v: { id: string; input: TaskInput }) => tasksApi.update(v.id, v.input),
  });
  const removeMutation = useMutation({ mutationFn: tasksApi.remove });
  const moveMutation = useMutation({
    mutationFn: (v: { id: string; status: TaskStatus; position: number }) => tasksApi.move(v.id, v.status, v.position),
  });

  const create = useCallback(
    async (input: TaskInput): Promise<boolean> => {
      try {
        const task = await createMutation.mutateAsync(input);
        setTasks((tasks) => [...tasks, task]);
        notify('Задача создана');
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [createMutation, setTasks, notify, fail],
  );

  const update = useCallback(
    async (id: string, input: TaskInput): Promise<boolean> => {
      try {
        const task = await updateMutation.mutateAsync({ id, input });
        setTasks((tasks) => tasks.map((t) => (t.id === id ? task : t)));
        notify('Изменения сохранены');
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [updateMutation, setTasks, notify, fail],
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await removeMutation.mutateAsync(id);
        setTasks((tasks) => applyRemove(tasks, id));
        notify('Задача удалена');
        return true;
      } catch (e) {
        fail(e);
        return false;
      }
    },
    [removeMutation, setTasks, notify, fail],
  );

  /**
   * Оптимистичный перенос: кэш меняется СИНХРОННО до запроса — карточка, отпущенная после
   * перетаскивания, не мигает на старом месте. Ошибка — откат к снимку и сообщение.
   */
  const move = useCallback(
    (id: string, status: TaskStatus, position: number, opts: { announce?: boolean } = {}) => {
      void qc.cancelQueries({ queryKey: TASKS_KEY });
      const snapshot = qc.getQueryData<Task[]>(TASKS_KEY);
      setTasks((tasks) => applyMove(tasks, id, status, position));
      moveMutation.mutate(
        { id, status, position },
        {
          onSuccess: () => opts.announce && notify(`Перемещено в «${STATUS_LABELS[status]}»`),
          onError: (e) => {
            qc.setQueryData(TASKS_KEY, snapshot);
            fail(e);
          },
          onSettled: () => void qc.invalidateQueries({ queryKey: TASKS_KEY }),
        },
      );
    },
    [qc, setTasks, moveMutation, notify, fail],
  );

  return {
    create,
    update,
    remove,
    move,
    saving: createMutation.isPending || updateMutation.isPending,
    removing: removeMutation.isPending,
  };
}
