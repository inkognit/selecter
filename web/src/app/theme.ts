'use client';

import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface TypeBackground {
    /** Подложка колонки доски. */
    column: string;
  }
}

/** Тема по docs/DESIGN.md §2: светлая и тёмная, выбор — по системной настройке. */
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#0052CC' },
        error: { main: '#DE350B' },
        background: { default: '#F4F5F7', paper: '#FFFFFF', column: '#EBECF0' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#4C9AFF' },
        error: { main: '#FF7452' },
        background: { default: '#121417', paper: '#1C1F24', column: '#22262C' },
      },
    },
  },
  shape: { borderRadius: 8 },
  // Системный стек: сборка и запуск не зависят от загрузки шрифтов из сети.
  typography: { fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", Arial, sans-serif' },
});
