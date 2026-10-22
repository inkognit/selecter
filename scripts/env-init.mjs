// Создаёт .env из .env.example, если .env ещё нет. Существующий .env не трогает.
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = path.join(root, '.env');

if (existsSync(env)) {
  console.log('.env уже есть — оставляю как есть');
} else {
  copyFileSync(path.join(root, '.env.example'), env);
  console.log('.env создан из .env.example');
}
