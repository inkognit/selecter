import path from 'node:path';
import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Единственный .env проекта лежит в корне репозитория (docs/PROMPT.md, этап 6).
config({ path: path.resolve(__dirname, '..', '.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: env('DATABASE_URL') },
});
