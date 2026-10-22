import path from 'node:path';
import { config } from 'dotenv';

/**
 * e2e работают в ОТДЕЛЬНОЙ базе kanban_test того же контейнера: таблицы чистятся перед
 * каждым тестом, рабочая доска не должна это почувствовать. TEST_DATABASE_URL — переопределение.
 */
export function testDatabaseUrl(): string {
  config({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
  if (!process.env.DATABASE_URL) throw new Error('Нет DATABASE_URL: скопируйте .env.example в .env');
  const url = new URL(process.env.DATABASE_URL);
  url.pathname = '/kanban_test';
  return url.toString();
}
