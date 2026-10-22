import { execSync } from 'node:child_process';
import path from 'node:path';
import { Client } from 'pg';
import { testDatabaseUrl } from './e2e-env';

/** Создаёт базу kanban_test (если нет) и накатывает на неё те же миграции, что и на рабочую. */
export default async function globalSetup(): Promise<void> {
  const testUrl = new URL(testDatabaseUrl());
  const dbName = testUrl.pathname.slice(1);
  const adminUrl = new URL(testUrl);
  adminUrl.pathname = '/postgres';

  const admin = new Client({ connectionString: adminUrl.toString() });
  try {
    await admin.connect();
  } catch (e) {
    throw new Error(`e2e: PostgreSQL недоступен (${(e as Error).message}). Поднимите: docker compose up -d --wait`, {
      cause: e,
    });
  }
  const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);
  if (!rowCount) await admin.query(`CREATE DATABASE "${dbName}"`);
  await admin.end();

  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: testUrl.toString() },
    stdio: 'pipe',
  });
}
