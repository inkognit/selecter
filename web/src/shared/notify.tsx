'use client';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

type Severity = 'success' | 'error';
type Notify = (message: string, severity?: Severity) => void;

interface Message {
  key: number;
  text: string;
  severity: Severity;
}

const NotifyContext = createContext<Notify>(() => {});

/** Snackbar на результат действия (docs/DESIGN.md §8): снизу по центру, 4 секунды. */
export function NotifyProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<Message | null>(null);
  const [open, setOpen] = useState(false);

  const notify = useCallback<Notify>((text, severity = 'success') => {
    setMessage({ key: Date.now(), text, severity });
    setOpen(true);
  }, []);

  const value = useMemo(() => notify, [notify]);

  return (
    <NotifyContext.Provider value={value}>
      {children}
      <Snackbar
        key={message?.key}
        open={open}
        autoHideDuration={4000}
        onClose={(_e, reason) => reason !== 'clickaway' && setOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 'calc(88px + env(safe-area-inset-bottom))', md: 24 } }}
      >
        <Alert
          severity={message?.severity ?? 'success'}
          variant="filled"
          onClose={() => setOpen(false)}
          data-testid="snackbar"
          sx={{ width: '100%' }}
        >
          {message?.text}
        </Alert>
      </Snackbar>
    </NotifyContext.Provider>
  );
}

export const useNotify = (): Notify => useContext(NotifyContext);
