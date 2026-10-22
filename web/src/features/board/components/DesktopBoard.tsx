'use client';

import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Box from '@mui/material/Box';
import { useMemo, useState, type ReactNode } from 'react';
import { TASK_STATUSES, type Task, type TaskStatus } from '@/api/types';
import type { Columns } from '../model/board';
import { resolveDrop, type ColumnIds } from '../model/dnd';
import { STATUS_LABELS } from '../model/labels';
import { columnsGridSx } from './BoardStates';
import { ColumnFrame, EmptyColumn } from './Column';
import { TaskCard, type TaskCardActions } from './TaskCard';

interface Props extends TaskCardActions {
  columns: Columns;
  onMove: (taskId: string, status: TaskStatus, position: number) => void;
}

const isStatus = (id: UniqueIdentifier): id is TaskStatus =>
  (TASK_STATUSES as readonly UniqueIdentifier[]).includes(id);

/**
 * Десктопная доска: три колонки в ряд, перетаскивание мышью и с клавиатуры (docs/DESIGN.md §7).
 * Во время перетаскивания порядок живёт в локальном состоянии; на отпускании — один запрос move.
 */
export function DesktopBoard({ columns, onMove, ...actions }: Props) {
  const byId = useMemo(
    () => new Map(TASK_STATUSES.flatMap((s) => columns[s].map((t) => [t.id, t] as const))),
    [columns],
  );
  const baseIds = useMemo(
    () => Object.fromEntries(TASK_STATUSES.map((s) => [s, columns[s].map((t) => t.id)])) as ColumnIds,
    [columns],
  );
  const [drag, setDrag] = useState<{ activeId: string; ids: ColumnIds } | null>(null);
  const ids = drag?.ids ?? baseIds;

  const sensors = useSensors(
    // 5px — чтобы клик по карточке оставался кликом, а не началом перетаскивания.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
      keyboardCodes: { start: ['Space'], cancel: ['Escape'], end: ['Space', 'Enter'] },
    }),
  );

  const containerOf = (id: UniqueIdentifier, current: ColumnIds): TaskStatus | null =>
    isStatus(id) ? id : (TASK_STATUSES.find((s) => current[s].includes(String(id))) ?? null);

  const onDragStart = ({ active }: DragStartEvent) => setDrag({ activeId: String(active.id), ids: baseIds });

  // Карточку перенесли над другой колонкой — переставляем её туда сразу, чтобы колонка раздвинулась.
  const onDragOver = ({ active, over }: DragOverEvent) => {
    if (!over || !drag) return;
    const from = containerOf(active.id, drag.ids);
    const to = containerOf(over.id, drag.ids);
    if (!from || !to || from === to) return;
    const activeId = String(active.id);
    const target = drag.ids[to];
    const overIndex = isStatus(over.id) ? target.length : target.indexOf(String(over.id));
    const at = overIndex < 0 ? target.length : overIndex;
    setDrag({
      activeId,
      ids: {
        ...drag.ids,
        [from]: drag.ids[from].filter((x) => x !== activeId),
        [to]: [...target.slice(0, at), activeId, ...target.slice(at)],
      },
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    const current = drag?.ids;
    setDrag(null);
    if (!over || !current) return;
    const task = byId.get(String(active.id));
    const drop = resolveDrop(current, String(active.id), String(over.id), containerOf);
    if (task && drop && (drop.status !== task.status || drop.position !== task.position)) {
      onMove(task.id, drop.status, drop.position);
    }
  };

  const activeTask = drag ? byId.get(drag.activeId) : undefined;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
      accessibility={{ announcements: announcements(byId, (id) => containerOf(id, ids)), screenReaderInstructions }}
    >
      <Box sx={columnsGridSx(false)}>
        {TASK_STATUSES.map((status) => (
          <DroppableColumn key={status} status={status} count={ids[status].length}>
            <SortableContext items={ids[status]} strategy={verticalListSortingStrategy}>
              {ids[status].length === 0 ? (
                <EmptyColumn status={status} />
              ) : (
                ids[status].map((id) => {
                  const task = byId.get(id);
                  return task ? <SortableTaskCard key={id} task={task} {...actions} /> : null;
                })
              )}
            </SortableContext>
          </DroppableColumn>
        ))}
      </Box>
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} lifted {...actions} /> : null}</DragOverlay>
    </DndContext>
  );
}

function DroppableColumn({ status, count, children }: { status: TaskStatus; count: number; children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <ColumnFrame status={status} title={STATUS_LABELS[status]} count={count} bodyRef={setNodeRef} highlighted={isOver}>
      {children}
    </ColumnFrame>
  );
}

function SortableTaskCard({ task, ...actions }: { task: Task } & TaskCardActions) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  return (
    <TaskCard
      ref={setNodeRef}
      task={task}
      dragProps={{ ...attributes, ...listeners }}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      placeholder={isDragging}
      {...actions}
    />
  );
}

const screenReaderInstructions = {
  draggable:
    'Чтобы взять задачу, нажмите пробел. Стрелками перемещайте её, пробел или Enter — отпустить, Escape — отменить.',
};

function announcements(byId: Map<string, Task>, columnOf: (id: UniqueIdentifier) => TaskStatus | null): Announcements {
  const name = (id: UniqueIdentifier) => `«${byId.get(String(id))?.title ?? ''}»`;
  const where = (id?: UniqueIdentifier) => {
    const s = id === undefined ? null : columnOf(id);
    return s ? `колонка «${STATUS_LABELS[s]}»` : 'вне колонок';
  };
  return {
    onDragStart: ({ active }) => `Задача ${name(active.id)} взята.`,
    onDragOver: ({ active, over }) => `Задача ${name(active.id)}: ${where(over?.id)}.`,
    onDragEnd: ({ active, over }) => `Задача ${name(active.id)} отпущена: ${where(over?.id)}.`,
    onDragCancel: ({ active }) => `Перемещение задачи ${name(active.id)} отменено.`,
  };
}
