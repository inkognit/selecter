'use client';

import AddIcon from '@mui/icons-material/Add';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import LinearProgress from '@mui/material/LinearProgress';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo, useState } from 'react';
import { humanizeApiError } from '@/api/errors';
import type { Task, TaskInput, TaskStatus } from '@/api/types';
import { useBoardActions, useTasks } from '../hooks/useBoard';
import { groupByStatus } from '../model/board';
import { BoardError, BoardSkeleton, EmptyBoard } from './BoardStates';
import { ConfirmDialog } from './ConfirmDialog';
import { DesktopBoard } from './DesktopBoard';
import { MobileBoard } from './MobileBoard';
import { TaskDialog, type TaskDialogMode } from './TaskDialog';

/** Граница раскладок из docs/DESIGN.md §3: < 768px — телефон. */
const MOBILE_QUERY = '(max-width:767.95px)';

type DialogState = { mode: 'create' } | { mode: Exclude<TaskDialogMode, 'create'>; taskId: string } | null;

/** Единственный экран: доска + диалоги поверх неё. Состояния загрузки/ошибки/пустоты — здесь. */
export function BoardPage() {
  const mobile = useMediaQuery(MOBILE_QUERY);
  const { data: tasks, isPending, isError, error, refetch, isFetching } = useTasks();
  const actions = useBoardActions();

  const [dialog, setDialog] = useState<DialogState>(null);
  const [toDelete, setToDelete] = useState<Task | null>(null);
  const [tab, setTab] = useState<TaskStatus>('NEW');

  const columns = useMemo(() => groupByStatus(tasks ?? []), [tasks]);
  // Задача из открытого диалога исчезла с доски (удалили в другой вкладке) — диалога больше нет.
  const dialogTask = dialog && dialog.mode !== 'create' ? (tasks?.find((t) => t.id === dialog.taskId) ?? null) : null;
  const dialogOpen = dialog?.mode === 'create' || dialogTask !== null;

  const openCreate = () => setDialog({ mode: 'create' });
  const cardActions = {
    onOpen: (t: Task) => setDialog({ mode: 'view', taskId: t.id }),
    onMoveTo: (t: Task, status: TaskStatus) => actions.move(t.id, status, Number.MAX_SAFE_INTEGER, { announce: true }),
    onDelete: (t: Task) => setToDelete(t),
  };

  const submit = async (input: TaskInput) => {
    if (dialog?.mode === 'create') {
      if (await actions.create(input)) {
        setDialog(null);
        setTab('NEW');
      }
    } else if (dialog?.mode === 'edit') {
      if (await actions.update(dialog.taskId, input)) setDialog({ mode: 'view', taskId: dialog.taskId });
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const ok = await actions.remove(toDelete.id);
    setToDelete(null);
    if (ok && dialog?.mode !== 'create' && dialog?.taskId === toDelete.id) setDialog(null);
  };

  let content;
  if (isPending) content = <BoardSkeleton mobile={mobile} />;
  else if (isError && !tasks)
    content = <BoardError message={humanizeApiError(error)} onRetry={() => void refetch()} retrying={isFetching} />;
  else if (tasks.length === 0) content = <EmptyBoard onCreate={openCreate} />;
  else if (mobile) content = <MobileBoard columns={columns} tab={tab} onTabChange={setTab} {...cardActions} />;
  else content = <DesktopBoard columns={columns} onMove={actions.move} {...cardActions} />;

  return (
    <Box
      data-testid="board"
      sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}
    >
      <AppBar position="static" color="default" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Toolbar sx={{ gap: 2, px: { xs: 2, md: 3 } }}>
          <Typography variant="h6" component="h1" sx={{ flex: 1 }}>
            Канбан-доска
          </Typography>
          {!mobile && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} data-testid="create-task-button">
              Новая задача
            </Button>
          )}
        </Toolbar>
        {/* Фоновая перезагрузка — тонкая полоса, без скелетонов: данные остаются на экране. */}
        <LinearProgress
          sx={{ height: 2, visibility: isFetching && !isPending ? 'visible' : 'hidden' }}
          aria-hidden={!isFetching}
        />
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 1440,
          mx: 'auto',
          p: { xs: 2, md: 3 },
          pb: { xs: 0, md: 3 },
        }}
      >
        {content}
      </Box>

      {mobile && tasks && tasks.length > 0 && (
        <Fab
          color="primary"
          aria-label="Новая задача"
          onClick={openCreate}
          data-testid="create-task-fab"
          sx={{ position: 'fixed', right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom))' }}
        >
          <AddIcon />
        </Fab>
      )}

      {dialogOpen && dialog && (
        <TaskDialog
          key={dialog.mode === 'create' ? 'create' : dialog.taskId}
          mode={dialog.mode}
          task={dialogTask}
          fullScreen={mobile}
          saving={actions.saving}
          onSubmit={(input) => void submit(input)}
          onEdit={() => dialogTask && setDialog({ mode: 'edit', taskId: dialogTask.id })}
          onCancelEdit={() => dialogTask && setDialog({ mode: 'view', taskId: dialogTask.id })}
          onClose={() => setDialog(null)}
          onDelete={cardActions.onDelete}
          onMoveTo={cardActions.onMoveTo}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title="Удалить задачу?"
        text={toDelete ? `Удалить задачу «${toDelete.title}»? Это действие нельзя отменить.` : ''}
        confirmLabel="Удалить"
        danger
        busy={actions.removing}
        testId="confirm-delete-button"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </Box>
  );
}
