'use client';

import AddIcon from '@mui/icons-material/Add';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { TASK_STATUSES } from '@/api/types';
import { STATUS_LABELS } from '../model/labels';
import { ColumnFrame } from './Column';

/** Загрузка: колонки с заголовками и по три скелетона карточек (docs/DESIGN.md §8). */
export function BoardSkeleton({ mobile }: { mobile: boolean }) {
  const statuses = mobile ? TASK_STATUSES.slice(0, 1) : TASK_STATUSES;
  return (
    <Box data-testid="board-loading" aria-busy="true" sx={columnsGridSx(mobile)}>
      {statuses.map((s) => (
        <ColumnFrame key={s} status={s} title={STATUS_LABELS[s]} count={null} hideHeader={mobile}>
          <Stack spacing={1}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} variant="rounded" height={84} />
            ))}
          </Stack>
        </ColumnFrame>
      ))}
    </Box>
  );
}

export function BoardError({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
      <Alert
        severity="error"
        data-testid="board-error"
        sx={{ maxWidth: 520, width: '100%' }}
        action={
          <Button color="inherit" size="small" onClick={onRetry} disabled={retrying} data-testid="retry-button">
            Повторить
          </Button>
        }
      >
        <AlertTitle>Не удалось загрузить доску</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
}

export function EmptyBoard({ onCreate }: { onCreate: () => void }) {
  return (
    <Stack data-testid="board-empty" spacing={2} sx={{ alignItems: 'center', py: 10, px: 2, textAlign: 'center' }}>
      <AssignmentOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h6">Задач пока нет</Typography>
      <Typography color="text.secondary">Создайте первую задачу — она появится в колонке «Новая».</Typography>
      <Button variant="contained" startIcon={<AddIcon />} onClick={onCreate} data-testid="create-first-task-button">
        Создать первую задачу
      </Button>
    </Stack>
  );
}

export const columnsGridSx = (mobile: boolean) => ({
  display: 'grid',
  gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(3, minmax(0, 1fr))',
  gap: 2,
  flex: 1,
  minHeight: 0,
});
