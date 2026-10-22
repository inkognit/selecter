import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { theme } from '@/app/theme';
import { NotifyProvider } from '@/shared/notify';
import { BoardPage } from './BoardPage';

/**
 * BoardPage рендерится по-настоящему (без моков компонентов) — подменён только fetch.
 * Проверяются состояния Ф-8: загрузка, ошибка с «Повторить», пустая доска, доска с задачами.
 */
function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <ThemeProvider theme={theme}>
      <QueryClientProvider client={client}>
        <NotifyProvider>
          <BoardPage />
        </NotifyProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

const envelope = (data: unknown) => new Response(JSON.stringify({ success: true, data, meta: null, error: null }));

const TASK = {
  id: '20c8f73e-ff67-4525-809d-d292f340a7cd',
  title: 'Настроить CI',
  description: 'Линтер и тесты',
  status: 'IN_PROGRESS',
  priority: 'HIGH',
  position: 0,
  createdAt: '2026-10-22T10:00:00.000Z',
  updatedAt: '2026-10-22T10:00:00.000Z',
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('BoardPage — состояния доски', () => {
  it('загрузка → скелетоны', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise(() => {})),
    );
    renderPage();
    expect(screen.getByTestId('board-loading')).toBeTruthy();
  });

  it('бэкенд недоступен → ошибка с понятным текстом; «Повторить» загружает доску', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(envelope([TASK]));
    vi.stubGlobal('fetch', fetchMock);
    renderPage();

    const error = await screen.findByTestId('board-error');
    expect(error.textContent).toContain('Сервер недоступен');

    fireEvent.click(screen.getByTestId('retry-button'));
    expect(await screen.findByTestId(`task-card-${TASK.id}`)).toBeTruthy();
  });

  it('пустая доска → призыв создать первую задачу; кнопка открывает форму', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => envelope([])),
    );
    renderPage();
    fireEvent.click(await screen.findByTestId('create-first-task-button'));
    expect(await screen.findByTestId('task-title-input')).toBeTruthy();
    expect((screen.getByTestId('task-submit-button') as HTMLButtonElement).disabled).toBe(true);
  });

  it('задачи → три колонки со счётчиками, карточка в своей колонке', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => envelope([TASK])),
    );
    renderPage();
    await screen.findByTestId(`task-card-${TASK.id}`);
    await waitFor(() => expect(screen.getByTestId('column-count-IN_PROGRESS').textContent).toBe('1'));
    expect(screen.getByTestId('column-count-NEW').textContent).toBe('0');
    expect(screen.getByTestId('column-empty-DONE')).toBeTruthy();
    expect(screen.getByTestId('column-IN_PROGRESS').textContent).toContain('Настроить CI');
  });
});
