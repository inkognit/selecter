import path from 'node:path';
import { config } from 'dotenv';

/**
 * Типизированная конфигурация приложения. Единственное место, где читается `process.env`
 * (сторож — architecture.spec.ts). Мусор в переменных — падение на старте, а не в запросе.
 */
export class AppConfig {
  constructor(
    readonly databaseUrl: string,
    readonly port: number,
    readonly corsOrigins: string[],
  ) {}
}

export class ConfigError extends Error {}

/**
 * Корневой `.env` проекта (путь можно переопределить через ENV_FILE в launch.json), затем
 * проверка. Уже заданные переменные окружения `.env` не перетирает — так e2e подменяют БД.
 */
export function loadAppConfig(): AppConfig {
  config({ path: process.env.ENV_FILE ?? path.resolve(__dirname, '..', '..', '..', '..', '.env'), quiet: true });
  return parseAppConfig(process.env);
}

export function parseAppConfig(env: NodeJS.ProcessEnv): AppConfig {
  const databaseUrl = env.DATABASE_URL?.trim();
  if (!databaseUrl) throw new ConfigError('DATABASE_URL не задан (см. .env.example)');

  const port = Number(env.PORT ?? 3500);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new ConfigError(`PORT должен быть целым 1–65535, получено «${env.PORT}»`);
  }

  const corsOrigins = (env.CORS_ORIGINS ?? 'http://localhost:3501,http://127.0.0.1:3501')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return new AppConfig(databaseUrl, port, corsOrigins);
}
