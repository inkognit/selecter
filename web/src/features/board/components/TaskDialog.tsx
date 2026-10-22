'use client';

import CloseIcon from '@mui/icons-material/Close';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useCallback, useState } from 'react';
import { TASK_STATUSES, type Task, type TaskInput, type TaskStatus } from '@/api/types';
import { formatDate, STATUS_LABELS } from '../model/labels';
import { EMPTY_FORM, formFromTask } from '../model/task-form';
import { ConfirmDialog } from './ConfirmDialog';
import { PriorityChip } from './PriorityChip';
import { TASK_FORM_ID, TaskForm } from './TaskForm';

export type TaskDialogMode = 'create' | 'view' | 'edit';

interface Props {
  mode: TaskDialogMode;
  /** Для view/edit. */
  task: Task | null;
  fullScreen: boolean;
  saving: boolean;
  onSubmit: (input: TaskInput) => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onClose: () => void;
  onDelete: (task: Task) => void;
  onMoveTo: (task: Task, status: TaskStatus) => void;
}

/** Диалог задачи: создание, просмотр, правка (docs/DESIGN.md §6). */
export function TaskDialog(props: Props) {
  const { mode, task, fullScreen, saving, onSubmit, onEdit, onCancelEdit, onClose } = props;
  const [form, setForm] = useState({ dirty: false, valid: mode !== 'create' });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const onFormState = useCallback((s: { dirty: boolean; valid: boolean }) => setForm(s), []);

  const editing = mode === 'create' || mode === 'edit';
  const requestClose = () => {
    if (saving) return;
    if (editing && form.dirty) setConfirmDiscard(true);
    else onClose();
  };

  const title = mode === 'create' ? 'Новая задача' : mode === 'edit' ? 'Редактирование' : (task?.title ?? '');

  return (
    <>
      <Dialog
        open
        onClose={requestClose}
        fullScreen={fullScreen}
        fullWidth
        maxWidth="sm"
        aria-labelledby="task-dialog-title"
        data-testid="task-dialog"
      >
        <DialogTitle id="task-dialog-title" sx={{ pr: 6, wordBreak: 'break-word' }}>
          {title}
          <IconButton aria-label="Закрыть" onClick={requestClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers={!editing}>
          {editing ? (
            <TaskForm
              initial={mode === 'edit' && task ? formFromTask(task) : EMPTY_FORM}
              onSubmit={onSubmit}
              onStateChange={onFormState}
            />
          ) : (
            task && <TaskDetails task={task} />
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, pb: fullScreen ? 'calc(16px + env(safe-area-inset-bottom))' : 2 }}>
          {editing ? (
            <>
              <Button onClick={mode === 'edit' ? onCancelEdit : requestClose} disabled={saving}>
                Отмена
              </Button>
              <Button
                type="submit"
                form={TASK_FORM_ID}
                variant="contained"
                disabled={saving || !form.valid}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
                data-testid="task-submit-button"
              >
                {mode === 'create' ? 'Создать' : 'Сохранить'}
              </Button>
            </>
          ) : (
            task && <ViewActions {...props} task={task} onEdit={onEdit} />
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDiscard}
        title="Отменить изменения?"
        text="Введённые данные не сохранятся."
        confirmLabel="Не сохранять"
        danger
        testId="confirm-discard-button"
        onConfirm={() => {
          setConfirmDiscard(false);
          onClose();
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </>
  );
}

function TaskDetails({ task }: { task: Task }) {
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
        <PriorityChip priority={task.priority} />
        <Chip size="small" variant="outlined" label={STATUS_LABELS[task.status]} data-testid="task-status" />
      </Stack>
      {task.description ? (
        <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} data-testid="task-description">
          {task.description}
        </Typography>
      ) : (
        <Typography color="text.secondary">Описания нет</Typography>
      )}
      <Box sx={{ color: 'text.secondary', typography: 'body2' }}>
        <div>Создана: {formatDate(task.createdAt)}</div>
        <div>Изменена: {formatDate(task.updatedAt)}</div>
      </Box>
    </Stack>
  );
}

function ViewActions({ task, onEdit, onDelete, onMoveTo }: Props & { task: Task }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  return (
    <Stack direction="row" spacing={1} useFlexGap sx={{ width: '100%', flexWrap: 'wrap' }}>
      <Button color="error" onClick={() => onDelete(task)} data-testid="delete-task-button">
        Удалить
      </Button>
      <Box sx={{ flex: 1 }} />
      <Button onClick={(e) => setAnchor(e.currentTarget)} data-testid="dialog-move-button">
        Переместить в…
      </Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {TASK_STATUSES.filter((s) => s !== task.status).map((s) => (
          <MenuItem
            key={s}
            data-testid={`dialog-move-to-${s}`}
            onClick={() => {
              setAnchor(null);
              onMoveTo(task, s);
            }}
          >
            {STATUS_LABELS[s]}
          </MenuItem>
        ))}
      </Menu>
      <Button variant="contained" onClick={onEdit} data-testid="edit-task-button">
        Редактировать
      </Button>
    </Stack>
  );
}
