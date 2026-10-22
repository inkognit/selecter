import os from 'node:os';
import type { NextConfig } from 'next';

// Фронт ходит в API по своему же origin (/api/v1/...), Next проксирует на бэкенд.
// Так нет CORS и доска открывается с телефона в локальной сети — телефону не нужен порт 3500.
const API_URL = process.env.API_URL ?? 'http://127.0.0.1:3500';

// Next 16 в dev-режиме отдаёт свои скрипты и HMR только «своим» origin. Без этого списка
// доска, открытая с телефона по http://<IP компьютера>:3501, навсегда остаётся на скелетонах
// (проверено 22.10.2026). Разрешаем только IPv4-адреса самого компьютера.
const localIps = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i!.address);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: localIps,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
