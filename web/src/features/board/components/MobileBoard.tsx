'use client';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { TASK_STATUSES, type TaskStatus } from '@/api/types';
import type { Columns } from '../model/board';
import { STATUS_LABELS } from '../model/labels';
import { ColumnFrame, EmptyColumn } from './Column';
import { TaskCard, type TaskCardActions } from './TaskCard';

interface Props extends TaskCardActions {
  columns: Columns;
  tab: TaskStatus;
  onTabChange: (status: TaskStatus) => void;
}

/**
 * Телефон (< 768px): колонки — вкладки со счётчиками, видна одна колонка. Перетаскивания нет —
 * на тач-экране оно спорит с прокруткой; перенос через меню «Переместить в…» (docs/DESIGN.md §3.2, §7).
 */
export function MobileBoard({ columns, tab, onTabChange, ...actions }: Props) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, gap: 1 }}>
      <Tabs
        value={tab}
        onChange={(_e, v: TaskStatus) => onTabChange(v)}
        variant="fullWidth"
        aria-label="Колонки доски"
        sx={{ bgcolor: 'background.paper', borderRadius: 1, minHeight: 44 }}
      >
        {TASK_STATUSES.map((s) => (
          <Tab
            key={s}
            value={s}
            label={`${STATUS_LABELS[s]} ${columns[s].length}`}
            data-testid={`column-tab-${s}`}
            sx={{ minHeight: 44, px: 0.5, textTransform: 'none', fontSize: 14 }}
          />
        ))}
      </Tabs>
      <ColumnFrame status={tab} title={STATUS_LABELS[tab]} count={columns[tab].length} hideHeader>
        {columns[tab].length === 0 ? (
          <EmptyColumn status={tab} />
        ) : (
          columns[tab].map((task) => <TaskCard key={task.id} task={task} {...actions} />)
        )}
        {/* Место под FAB, чтобы он не закрывал последнюю карточку. */}
        <Box sx={{ height: 72 }} />
      </ColumnFrame>
    </Box>
  );
}
