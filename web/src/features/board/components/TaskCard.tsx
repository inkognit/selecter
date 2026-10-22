'use client';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { forwardRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent } from 'react';
import { TASK_STATUSES, type Task, type TaskStatus } from '@/api/types';
import { STATUS_LABELS } from '../model/labels';
import { PriorityChip } from './PriorityChip';

export interface TaskCardActions {
  onOpen: (task: Task) => void;
  onMoveTo: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
}

interface Props extends TaskCardActions {
  task: Task;
  /** Обработчики и атрибуты DnD (useSortable) — только на десктопе. */
  dragProps?: HTMLAttributes<HTMLDivElement>;
  style?: CSSProperties;
  /** Исходное место перетаскиваемой карточки — пунктирная заглушка. */
  placeholder?: boolean;
  /** Карточка «в руке» (DragOverlay). */
  lifted?: boolean;
}

const clamp2 = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
  wordBreak: 'break-word' as const,
};

/** Карточка задачи (docs/DESIGN.md §5). Клик — просмотр; меню ⋮ — переместить, удалить. */
export const TaskCard = forwardRef<HTMLDivElement, Props>(function TaskCard(
  { task, dragProps, style, placeholder, lifted, onOpen, onMoveTo, onDelete },
  ref,
) {
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const closeMenu = () => setMenuAnchor(null);

  // Enter открывает задачу; пробел (и стрелки) остаются за клавиатурным DnD.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && e.key === 'Enter') {
      e.preventDefault();
      onOpen(task);
      return;
    }
    dragProps?.onKeyDown?.(e);
  };

  return (
    <Card
      ref={ref}
      variant="outlined"
      {...dragProps}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Задача «${task.title}»`}
      data-testid={`task-card-${task.id}`}
      onClick={() => onOpen(task)}
      style={style}
      sx={{
        p: 1.5,
        mb: 1,
        cursor: lifted ? 'grabbing' : 'pointer',
        userSelect: 'none',
        touchAction: 'manipulation',
        transition: 'box-shadow 120ms',
        '&:hover': { boxShadow: 2 },
        '&:focus-visible': { outline: 2, outlineColor: 'primary.main', outlineOffset: 1 },
        ...(placeholder && { opacity: 0.4, borderStyle: 'dashed' }),
        ...(lifted && { boxShadow: 8, transform: 'rotate(2deg)', opacity: 0.9 }),
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ flex: 1, ...clamp2 }}>
          {task.title}
        </Typography>
        <IconButton
          size="small"
          aria-label="Действия"
          data-testid={`task-menu-${task.id}`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuAnchor(e.currentTarget);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          sx={{ mt: -0.5, mr: -0.5 }}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      </Box>
      {task.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, ...clamp2 }}>
          {task.description}
        </Typography>
      )}
      <Box sx={{ mt: 1 }}>
        <PriorityChip priority={task.priority} />
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu} onClick={(e) => e.stopPropagation()}>
        <MenuItem
          onClick={() => {
            closeMenu();
            onOpen(task);
          }}
        >
          Открыть
        </MenuItem>
        <Divider />
        {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
          <MenuItem
            key={s}
            data-testid={`move-to-${s}`}
            onClick={() => {
              closeMenu();
              onMoveTo(task, s);
            }}
          >
            <ListItemText primary={`Переместить в «${STATUS_LABELS[s]}»`} />
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => {
            closeMenu();
            onDelete(task);
          }}
        >
          Удалить
        </MenuItem>
      </Menu>
    </Card>
  );
});
