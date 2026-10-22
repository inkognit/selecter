'use client';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { NotifyProvider } from '@/shared/notify';
import { theme } from './theme';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          // Ошибка загрузки показывается с кнопкой «Повторить» — без долгих автоповторов.
          queries: { retry: 1, refetchOnWindowFocus: true, staleTime: 5_000 },
          mutations: { retry: 0 },
        },
      }),
  );

  return (
    <ThemeProvider theme={theme} defaultMode="system">
      <CssBaseline enableColorScheme />
      <QueryClientProvider client={queryClient}>
        <NotifyProvider>{children}</NotifyProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
