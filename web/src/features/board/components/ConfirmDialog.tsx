'use client';

import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

interface Props {
  open: boolean;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  testId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Подтверждение необратимого действия. Фокус по умолчанию — на «Отмена» (docs/DESIGN.md §6.3). */
export function ConfirmDialog({ open, title, text, confirmLabel, danger, busy, testId, onConfirm, onCancel }: Props) {
  return (
    <Dialog open={open} onClose={busy ? undefined : onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{text}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} autoFocus disabled={busy}>
          Отмена
        </Button>
        <Button
          onClick={onConfirm}
          color={danger ? 'error' : 'primary'}
          variant="contained"
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : undefined}
          data-testid={testId}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
