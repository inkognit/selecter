'use client';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { ReactNode, Ref } from 'react';
import type { TaskStatus } from '@/api/types';
import { STATUS_COLORS } from '../model/labels';

interface Props {
  status: TaskStatus;
  title: string;
  /** null — счётчик не показывать (загрузка). */
  count: number | null;
  /** На телефоне название и счётчик — во вкладке, в колонке их нет. */
  hideHeader?: boolean;
  /** Зона сброса DnD (десктоп) — подсветка, когда карточку держат над колонкой. */
  bodyRef?: Ref<HTMLDivElement>;
  highlighted?: boolean;
  children: ReactNode;
}

/** Каркас колонки: цветная полоса, заголовок со счётчиком, прокручиваемый список (docs/DESIGN.md §3.1). */
export function ColumnFrame({ status, title, count, hideHeader, bodyRef, highlighted, children }: Props) {
  const headingId = `column-title-${status}`;
  return (
    <Paper
      component="section"
      elevation={0}
      aria-labelledby={hideHeader ? undefined : headingId}
      aria-label={hideHeader ? title : undefined}
      data-testid={`column-${status}`}
      sx={{
        bgcolor: 'background.column',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        borderTop: hideHeader ? 0 : 3,
        borderColor: `${STATUS_COLORS[status]}.main`,
      }}
    >
      {!hideHeader && (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', px: 2, pt: 1.5, pb: 1 }}>
          <Typography id={headingId} variant="h6" component="h2" sx={{ fontSize: 16 }}>
            {title}
          </Typography>
          {count !== null && (
            <Typography
              variant="body2"
              color="text.secondary"
              data-testid={`column-count-${status}`}
              aria-label={`задач: ${count}`}
            >
              {count}
            </Typography>
          )}
        </Stack>
      )}
      <Box
        ref={bodyRef}
        sx={{
          flex: 1,
          minHeight: 120,
          overflowY: 'auto',
          px: 1.5,
          pb: 'calc(12px + env(safe-area-inset-bottom))',
          pt: hideHeader ? 1.5 : 0,
          outline: highlighted ? 2 : 0,
          outlineColor: 'primary.main',
          outlineOffset: -2,
          borderRadius: 1,
          transition: 'outline-color 120ms',
        }}
      >
        {children}
      </Box>
    </Paper>
  );
}

/** Пустая колонка — подпись в пунктирной рамке; на десктопе она же зона сброса. */
export function EmptyColumn({ status }: { status: TaskStatus }) {
  return (
    <Box
      data-testid={`column-empty-${status}`}
      sx={{
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 1,
        py: 4,
        textAlign: 'center',
        color: 'text.secondary',
        typography: 'body2',
      }}
    >
      Нет задач
    </Box>
  );
}
